import pool from '../config/db.js'

const createGroup = async (req, res) => {
    const { group_name, group_desc } = req.body;
    const userId = req.user.user_id; // The user_id that came via the jwt token variable

    if (!group_name) {
        return res.status(400).json({ message: 'Group name required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const groupResult = await client.query(
            'INSERT INTO groups (group_name, group_desc, created_by) VALUES ($1, $2, $3) RETURNING group_id, group_name, group_desc, created_by, created_at',
            [group_name, group_desc, userId]
        );

        const group = groupResult.rows[0];

        await client.query(
            'INSERT INTO group_user (user_id, group_id, role) VALUES ($1, $2, $3)',
            [userId, group.group_id, 'admin']
        );

        await client.query('COMMIT');

        return res.status(200).json(group);

    }

    catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
    }
    finally {
        client.release();
    }
};

const accessGroup = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query(
            `SELECT g.group_id, g.group_name, g.group_desc, g.created_by, g.created_at
            FROM groups g
            JOIN group_user gu ON g.group_id = gu.group_id
            WHERE gu.user_id = $1`, [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch groups' });
    }
};

const getGroupById = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT g.group_id, g.group_name, g.group_desc, g.created_by, g.created_at
                 FROM groups g
                 JOIN group_user gu ON g.group_id = gu.group_id
                 WHERE g.group_id = $1 AND gu.user_id = $2`,
            [id, userId]
        );

        const group = result.rows[0];

        if (!group) {
            return res.status(404).json({ message: 'Group not found' })
        }

        res.status(200).json(group);
    }

    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch group' });
    }
};

const addGroupMember = async (req, res) => {
    try {
        const requesterId = req.user.user_id;
        const { id: groupId } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check requester is an admin of this group
        const adminCheck = await pool.query(
            `SELECT role FROM group_user WHERE group_id = $1 AND user_id = $2`,
            [groupId, requesterId]
        );
        const requesterMembership = adminCheck.rows[0];

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can add members' });
        }

        const userResult = await pool.query(
            `SELECT user_id FROM users WHERE email = $1`,
            [email]
        );
        const newUser = userResult.rows[0];
        if (!newUser) {
            return res.status(404).json({ message: 'No user found with that email' });
        }
        const newMemberId = newUser.user_id;

        const existingMember = await pool.query(
            `SELECT relation_id FROM group_user WHERE group_id = $1 AND user_id = $2`,
            [groupId, newMemberId]
        );

        if (existingMember.rows.length > 0) {
            return res.status(409).json({ message: 'User is already a member of this group' });
        }

        // Add the new member
        const result = await pool.query(
            `INSERT INTO group_user (user_id, group_id, role) VALUES ($1, $2, 'member') RETURNING relation_id, user_id, group_id, role, joined_at`,
            [newMemberId, groupId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add member' });
    }
};

const getGroupMembers = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id: groupId } = req.params;

        const memberCheck = await pool.query(
            `SELECT user_id FROM group_user WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        const result = await pool.query(
            `SELECT u.user_id, u.username, u.email, gu.role, gu.joined_at
             FROM group_user gu
             JOIN users u ON u.user_id = gu.user_id
             WHERE gu.group_id = $1
             ORDER BY gu.joined_at`,
            [groupId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
};

export { createGroup, accessGroup, getGroupById, addGroupMember, getGroupMembers };