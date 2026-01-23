import db from "../config/db.js";

/**
 * Log an action to the audit_logs table
 * @param {string} action - Description of the action
 * @param {string} tableName - Affected table
 * @param {number} recordId - ID of the affected record
 * @param {number} userId - ID of the user performing the action
 * @param {object} oldValue - Data before change
 * @param {object} newValue - Data after change
 */
export const logAction = async (
  action,
  tableName,
  recordId,
  userId,
  oldValue = null,
  newValue = null,
) => {
  try {
    await db.query(
      "INSERT INTO audit_logs (action, table_name, record_id, user_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)",
      [
        action,
        tableName,
        recordId,
        userId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ],
    );
  } catch (err) {
    console.error("Failed to log action:", err);
  }
};
