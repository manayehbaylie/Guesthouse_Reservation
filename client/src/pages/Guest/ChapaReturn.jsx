
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  XCircle,
} from "lucide-react";
import { ApiService } from "../../services/api.js";

export function ChapaReturn() {
  const location = useLocation();
  const navigate = useNavigate();

  const [message, setMessage] = useState(
    "Verifying your payment..."
  );

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const params = new URLSearchParams(location.search);

    const txRef = params.get("tx_ref");
    const chapaStatus = params.get("status");

    const verifyPayment = async () => {
      try {
        /*
         * ============================================================
         * GET CHAPA TRANSACTION REFERENCE
         * ============================================================
         */

        if (!txRef) {
          throw new Error(
            "Payment reference was not returned by Chapa."
          );
        }

        /*
         * ============================================================
         * VERIFY PAYMENT THROUGH YOUR BACKEND
         * ============================================================
         */

        const payment =
          await ApiService.getChapaPaymentStatus(txRef);

        if (!mounted) {
          return;
        }

        /*
         * ============================================================
         * PAYMENT SUCCESS
         *
         * THIS IS THE IMPORTANT CHANGE.
         *
         * We do NOT go to:
         *
         * /guest/dashboard
         *
         * We go to:
         *
         * /guest/payment-receipt
         *
         * which is our CUSTOM receipt page.
         * ============================================================
         */

        if (payment?.status === "paid") {

          navigate("/guest/payment-receipt", {
            replace: true,

            state: {
              paymentStatus: "PAID",
              payment: payment,
              txRef: txRef,
            },
          });

          return;
        }

        /*
         * ============================================================
         * PAYMENT FAILED / CANCELLED
         * ============================================================
         */

        if (
          chapaStatus === "failed" ||
          chapaStatus === "cancelled"
        ) {
          throw new Error(
            "Your Chapa payment was not completed."
          );
        }

        /*
         * ============================================================
         * PAYMENT STILL PENDING
         * ============================================================
         */

        throw new Error(
          "Payment is still pending verification."
        );

      } catch (error) {

        if (!mounted) {
          return;
        }

        console.error(
          "Chapa payment verification error:",
          error
        );

        setFailed(true);

        setMessage(
          error?.message ||
            "Payment verification failed."
        );
      }
    };

    verifyPayment();

    return () => {
      mounted = false;
    };

  }, [location.search, navigate]);

  /*
   * ================================================================
   * VERIFICATION / ERROR SCREEN
   * ================================================================
   */

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6">

      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl">

        {failed ? (
          <XCircle
            className="mx-auto h-16 w-16 text-red-600"
            strokeWidth={1.8}
          />
        ) : (
          <Loader2
            className="mx-auto h-16 w-16 animate-spin text-amber-500"
            strokeWidth={1.8}
          />
        )}

        <h1 className="mt-6 text-2xl font-black text-stone-900">
          Chapa Payment
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-600">
          {message}
        </p>

        {failed && (
          <button
            type="button"
            onClick={() =>
              navigate("/guest/dashboard", {
                replace: true,

                state: {
                  paymentStatus: "FAILED",
                  paymentMessage: message,
                },
              })
            }
            className="mt-7 w-full rounded-2xl bg-stone-900 px-5 py-4 text-sm font-black text-white transition hover:bg-stone-800"
          >
            Back to Dashboard
          </button>
        )}

      </section>

    </main>
  );
}

export default ChapaReturn;

