import { UserRole } from '../../core/types';
import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import {
	createUser,
	deleteUser,
	getUserById,
	listUsers,
	updateUser,
	updateUserRole,
	updateUserStatus,
} from '../controllers/userController';
import {
	createTransaction,
	deleteTransaction,
	getTransactionById,
	listTransactions,
	updateTransaction,
} from '../controllers/transactionController';
import {
	getDashboardCategoryTotals,
	getDashboardRecentActivity,
	getDashboardSummary,
	getDashboardTrends,
} from '../controllers/dashboardController';

// Import middleware
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

/**
 * Health check (no auth required)
 */
router.get('/health', healthCheck);

/**
 * Protected route example
 * Once services are implemented, add routes here
 */

// Users routes (ADMIN only)
router.post('/users', authenticateJWT, requireRole(UserRole.ADMIN), createUser);
router.get('/users', authenticateJWT, requireRole(UserRole.ADMIN), listUsers);
router.get('/users/:id', authenticateJWT, requireRole(UserRole.ADMIN), getUserById);
router.patch('/users/:id', authenticateJWT, requireRole(UserRole.ADMIN), updateUser);
router.patch('/users/:id/role', authenticateJWT, requireRole(UserRole.ADMIN), updateUserRole);
router.patch('/users/:id/status', authenticateJWT, requireRole(UserRole.ADMIN), updateUserStatus);
router.delete('/users/:id', authenticateJWT, requireRole(UserRole.ADMIN), deleteUser);

// Transactions routes (ANALYST+ only)
router.post(
	'/transactions',
	authenticateJWT,
	requireRole(UserRole.ANALYST, UserRole.ADMIN),
	createTransaction
);
router.get(
	'/transactions',
	authenticateJWT,
	requireRole(UserRole.ANALYST, UserRole.ADMIN),
	listTransactions
);
router.get(
	'/transactions/:id',
	authenticateJWT,
	requireRole(UserRole.ANALYST, UserRole.ADMIN),
	getTransactionById
);
router.patch(
	'/transactions/:id',
	authenticateJWT,
	requireRole(UserRole.ANALYST, UserRole.ADMIN),
	updateTransaction
);
router.delete(
	'/transactions/:id',
	authenticateJWT,
	requireRole(UserRole.ADMIN),
	deleteTransaction
);

// Dashboard routes (VIEWER+)
router.get(
	'/dashboard/summary',
	authenticateJWT,
	requireRole(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
	getDashboardSummary
);
router.get(
	'/dashboard/category-totals',
	authenticateJWT,
	requireRole(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
	getDashboardCategoryTotals
);
router.get(
	'/dashboard/recent-activity',
	authenticateJWT,
	requireRole(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
	getDashboardRecentActivity
);
router.get(
	'/dashboard/trends',
	authenticateJWT,
	requireRole(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
	getDashboardTrends
);

export default router;
