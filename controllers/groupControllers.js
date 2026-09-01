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

export { createGroup };