import express from "express";

import {
  create,
  getAll,
  getById,
  updateStatus,
  initiate,
  getHistory,
} from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
============================================================
PAYMENT ROUTES
Base URL:
    /api/payments
============================================================
*/


/*
============================================================
1. INITIATE PAYMENT
============================================================

POST /api/payments/initiate

Used by:
    PaymentScreen.jsx

Supported payment methods:
    - CHAPA
    - TELEBIRR
    - BANK_TRANSFER

Authentication:
    Required

Authorization:
    Any authenticated user
*/
router.post(
  "/initiate",
  authenticate,
  initiate
);


/*
============================================================
2. GUEST PAYMENT HISTORY
============================================================

GET /api/payments/history

Returns payments belonging to the logged-in guest.

Authentication:
    Required

Authorization:
    Any authenticated user
*/
router.get(
  "/history",
  authenticate,
  getHistory
);


/*
============================================================
3. CREATE PAYMENT
============================================================

POST /api/payments

Used to create a payment request.

Authentication:
    Required

Authorization:
    GUEST only
*/
router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  create
);


/*
============================================================
4. GET ALL PAYMENTS
============================================================

GET /api/payments

Used by:
    Admin payment management

Authentication:
    Required

Authorization:
    ADMIN only
*/
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAll
);


/*
============================================================
5. GET PAYMENT BY ID
============================================================

GET /api/payments/:id

Example:
    GET /api/payments/15

Authentication:
    Required

Authorization:
    ADMIN or GUEST
*/
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "GUEST"),
  getById
);


/*
============================================================
6. UPDATE PAYMENT STATUS
============================================================

PUT /api/payments/:id/status

Example:

PUT /api/payments/15/status

Body:
{
  "status": "PAID"
}

Allowed statuses:
    PENDING
    PAID
    FAILED

Important:

When status is changed to PAID,
payment.service.js uses:

    markPaymentAsPaid()

which performs:

    Payment
    PENDING
       ↓
    PAID

and:

    Reservation
    PENDING
       ↓
    CONFIRMED

It also sends payment-success
notifications.
*/
router.put(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  updateStatus
);


/*
============================================================
EXPORT ROUTER
============================================================
*/

export default router;