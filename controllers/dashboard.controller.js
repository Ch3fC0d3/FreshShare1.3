const db = require('../models');
const User = db.user;
const Group = db.group;
const Listing = db.listing;
const Order = db.order;
const Message = db.message;
const mongoose = require('mongoose');

/**
 * Dashboard controller to fetch all relevant user data for the dashboard
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Get user ID from session
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get current date for calendar events
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Fetch all data in parallel for better performance
    const [
      user,
      upcomingDeliveries,
      recentOrders,
      messages,
      groupActivities,
      calendarEvents,
    ] = await Promise.all([
      // Get user details
      User.findById(userId).populate('roles').exec(),

      // Get upcoming deliveries (orders where user is buyer and status is pending or confirmed)
      Order.find({
        buyer: userId,
        status: { $in: ['pending', 'confirmed'] },
        deliveryDate: { $gte: today },
      })
        .sort({ deliveryDate: 1 })
        .limit(5)
        .populate('listing')
        .populate('seller', 'username profileImage')
        .exec(),

      // Get recent orders (completed)
      Order.find({
        $or: [{ buyer: userId }, { seller: userId }],
        status: 'completed',
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('listing')
        .populate('buyer', 'username profileImage')
        .populate('seller', 'username profileImage')
        .exec(),

      // Get recent messages
      Message.find({
        $or: [{ sender: userId }, { recipient: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('sender', 'username profileImage')
        .populate('recipient', 'username profileImage')
        .exec(),

      // Get user's groups and recent activity
      Group.find({
        'members.user': userId,
      })
        .limit(5)
        .exec(),

      // Get calendar events (orders with delivery dates in current month)
      Order.find({
        $or: [{ buyer: userId }, { seller: userId }],
        deliveryDate: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lte: new Date(currentYear, currentMonth + 1, 0),
        },
      })
        .populate('listing')
        .exec(),
    ]);

    // Format calendar events for the frontend
    const formattedCalendarEvents = calendarEvents.map((order) => {
      const date = new Date(order.deliveryDate);
      return {
        day: date.getDate(),
        type: order.buyer.toString() === userId ? 'delivery' : 'pickup',
        title: order.listing ? order.listing.title : 'Order',
        orderId: order._id,
      };
    });

    // Get days with events for highlighting in calendar
    const daysWithEvents = [
      ...new Set(formattedCalendarEvents.map((event) => event.day)),
    ];

    // Format messages for the frontend
    const formattedMessages = messages.map((msg) => {
      const isIncoming = msg.recipient.toString() === userId;
      const otherUser = isIncoming ? msg.sender : msg.recipient;

      return {
        id: msg._id,
        user: otherUser
          ? {
              username: otherUser.username,
              profileImage: otherUser.profileImage,
            }
          : {
              username: 'Unknown',
              profileImage: '/assets/images/avatar-placeholder.jpg',
            },
        message: msg.content,
        time: formatTimeAgo(msg.createdAt),
        isIncoming,
      };
    });

    // Return all dashboard data
    return res.status(200).json({
      user: {
        username: user.username,
        fullName: user.firstName + ' ' + user.lastName,
        profileImage: user.profileImage,
        location: user.location,
      },
      upcomingDeliveries,
      recentOrders,
      messages: formattedMessages,
      groupActivities,
      calendar: {
        currentMonth,
        currentYear,
        daysWithEvents,
        events: formattedCalendarEvents,
      },
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}
