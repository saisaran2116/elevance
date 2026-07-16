const { Post, Friend, User, Like, Comment } = require('../models');
const { Op } = require('sequelize');

exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes auth middleware sets req.user

    // 1. Calculate the number of accepted friends for this user
    const friendsCount = await Friend.count({
      where: {
        [Op.or]: [{ userId }, { friendId: userId }],
        status: 'accepted'
      }
    });

    // 2. Check limits based strictly on friend count
    if (friendsCount === 0) {
      return res.status(403).json({ message: 'Posting disabled. You need at least 1 friend to post.' });
    }

    let dailyLimit = 0;
    if (friendsCount > 10) {
      dailyLimit = Infinity; // more than 10 friends = unlimited posts
    } else {
      dailyLimit = friendsCount; // 1 friend = 1 post/day; 2 friends = 2 posts/day, etc.
    }

    // 3. If not unlimited, check how many posts created today
    if (dailyLimit !== Infinity) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const postsToday = await Post.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: startOfDay
          }
        }
      });

      if (postsToday >= dailyLimit) {
        return res.status(403).json({ 
          message: `You have reached your limit of ${dailyLimit} post(s) today. Add more friends to increase your limit!` 
        });
      }
    }

    // 4. Create the post
    const { mediaUrl, mediaType, content } = req.body;
    const newPost = await Post.create({
      userId,
      mediaUrl,
      mediaType,
      content
    });

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: Like, as: 'likes' },
        { 
          model: Comment, 
          as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
        }
      ]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = await Like.findOne({ where: { userId, postId } });
    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      return res.json({ message: 'Post unliked successfully' });
    } else {
      // Like
      await Like.create({ userId, postId });
      return res.json({ message: 'Post liked successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

exports.commentPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { content } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = await Comment.create({
      userId,
      postId,
      content
    });

    const commentWithUser = await Comment.findByPk(newComment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    res.status(201).json({ message: 'Comment added successfully', comment: commentWithUser });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};
