import pool from '../config/db.js';
import { calculateBalances, simplifyDebts } from '../utils/balanceCalculator.js';

const addExpense = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.user_id;
        const { id: groupId } = req.params;
        const { total_amount, expense_description } = req.body;

        if (!total_amount || total_amount <= 0) {
            return res.status(400).json({ message: 'Valid total_amount is required' });
        }

        // confirm requester is a member of this group
        const memberCheck = await client.query(
            `SELECT user_id FROM group_user WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        // get all members to split equally
        const members = await client.query(
            `SELECT user_id FROM group_user WHERE group_id = $1`,
            [groupId]
        );
        const memberIds = members.rows.map(r => r.user_id);
        const splitAmount = Math.round((total_amount / memberIds.length) * 100) / 100;

        await client.query('BEGIN');

        const expenseResult = await client.query(
            `INSERT INTO expenses (group_id, paid_by, total_amount, expense_description)
             VALUES ($1, $2, $3, $4) RETURNING expense_id, group_id, paid_by, total_amount, expense_description, expense_datetime`,
            [groupId, userId, total_amount, expense_description]
        );
        const expense = expenseResult.rows[0];

        for (const memberId of memberIds) {
            await client.query(
                `INSERT INTO expense_user (user_id, expense_id, amount_owed) VALUES ($1, $2, $3)`,
                [memberId, expense.expense_id, splitAmount]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(expense);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Failed to add expense' });
    } finally {
        client.release();
    }
};

const getGroupExpenses = async (req, res) => {

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
            `SELECT e.expense_id, e.group_id, e.paid_by, u.username AS paid_by_username,
            e.total_amount, e.expense_description, e.expense_datetime
            FROM expenses e
            JOIN users u ON u.user_id = e.paid_by
            WHERE e.group_id = $1
            ORDER BY e.expense_datetime DESC`,
            [groupId]
        );
        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch expenses' });
    }
};

const getGroupBalances = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id: groupId } = req.params;

        // confirm requester is a member of this group
        const memberCheck = await pool.query(
            `SELECT user_id FROM group_user WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        const result = await pool.query(
            `SELECT e.expense_id, e.paid_by, e.total_amount, eu.user_id AS ower_id, eu.amount_owed
             FROM expenses e
             JOIN expense_user eu ON eu.expense_id = e.expense_id
             WHERE e.group_id = $1`,
            [groupId]
        );

        const balances = calculateBalances(result.rows);
        const settlements = simplifyDebts(balances.map(b => ({ ...b })));

        res.status(200).json({ balances, settlements });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to calculate balances' });
    }
};

export { addExpense, getGroupExpenses, getGroupBalances };

