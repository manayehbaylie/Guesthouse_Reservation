import prisma from "../config/prisma.js";
import { sendTelegramMessage } from "./telegram-api.service.js";
import { normalizeTelegramLanguage, telegramText } from "./telegram-bot.i18n.js";

const formatAddisPaymentTime = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${fields.year}-${fields.month}-${fields.day} ${fields.hour}:${fields.minute} ${fields.dayPeriod}`;
};

export const notifyTelegramPaymentConfirmation = async (payment) => {
  if (!payment?.id || payment.status !== "PAID") return false;

  const reservation = await prisma.reservation.findUnique({
    where: { id: payment.reservationId || payment.reservation?.id },
    include: {
      room: { include: { guesthouse: { select: { name: true } } } },
      payment: true,
    },
  });
  if (!reservation) return false;
  const account = await prisma.telegramAccount.findUnique({
    where: { userId: reservation.guestId },
    select: { telegramId: true },
  });
  if (!account) return false;

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: "PAID", telegramNotifiedAt: null },
    data: { telegramNotifiedAt: new Date() },
  });
  if (claimed.count !== 1) return false;

  const paidAt = formatAddisPaymentTime(payment.updatedAt || new Date());
  const receipt = [
    "Payment successful",
    `Reservation: #${reservation.id}`,
    `Guesthouse: ${reservation.room?.guesthouse?.name || "Guesthouse"}`,
    `Room: ${reservation.room?.roomNumber || reservation.room?.roomType || "Room"}`,
    `Dates: ${new Date(reservation.checkIn).toISOString().slice(0, 10)} to ${new Date(reservation.checkOut).toISOString().slice(0, 10)}`,
    `Guests: ${reservation.numberOfGuests} guest${Number(reservation.numberOfGuests) === 1 ? "" : "s"}`,
    `Amount: ${Number(payment.amount).toLocaleString("en-US")} ETB`,
    `Reference: ${payment.chapaTxRef || `GH-${String(payment.id).padStart(8, "0")}`}`,
    `Paid at: ${paidAt}`,
  ].join("\n");

  try {
    const sent = await sendTelegramMessage(account.telegramId, receipt);
    if (sent) return true;
    await prisma.payment.updateMany({
      where: { id: payment.id, telegramNotifiedAt: { not: null } },
      data: { telegramNotifiedAt: null },
    });
    return false;
  } catch (error) {
    await prisma.payment.updateMany({
      where: { id: payment.id, telegramNotifiedAt: { not: null } },
      data: { telegramNotifiedAt: null },
    });
    throw error;
  }
};

export const notifyTelegramPaymentFailure = async (paymentOrId) => {
  const paymentId = Number(paymentOrId?.id || paymentOrId);
  if (!Number.isInteger(paymentId) || paymentId <= 0) return false;
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { reservation: { select: { id: true, guestId: true } } },
  });
  if (!payment || payment.status !== "FAILED") return false;
  const account = await prisma.telegramAccount.findUnique({
    where: { userId: payment.reservation.guestId },
    select: { telegramId: true, user: { select: { language: true } } },
  });
  if (!account) return false;

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: "FAILED", telegramNotifiedAt: null },
    data: { telegramNotifiedAt: new Date() },
  });
  if (claimed.count !== 1) return false;

  const language = normalizeTelegramLanguage(account.user?.language);
  try {
    const sent = await sendTelegramMessage(
      account.telegramId,
      telegramText(language, "paymentFailedRetry", { id: payment.reservation.id }),
      { reply_markup: { inline_keyboard: [[{ text: telegramText(language, "tryAnotherMethod"), callback_data: `payment:choose:${payment.reservation.id}` }]] } }
    );
    if (sent) return true;
    await prisma.payment.updateMany({ where: { id: payment.id, telegramNotifiedAt: { not: null } }, data: { telegramNotifiedAt: null } });
    return false;
  } catch (error) {
    await prisma.payment.updateMany({ where: { id: payment.id, telegramNotifiedAt: { not: null } }, data: { telegramNotifiedAt: null } });
    throw error;
  }
};

export const notifyTelegramBookingRefundRequired = async (payment) => {
  if (!payment?.id || payment.status !== "REFUND_REQUIRED" || !payment.bookingDraftId) return false;
  const draft = await prisma.bookingDraft.findUnique({ where: { id: payment.bookingDraftId } });
  if (!draft) return false;
  const account = await prisma.telegramAccount.findUnique({
    where: { userId: draft.userId },
    select: { telegramId: true, user: { select: { language: true } } },
  });
  if (!account) return false;

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: "REFUND_REQUIRED", telegramNotifiedAt: null },
    data: { telegramNotifiedAt: new Date() },
  });
  if (claimed.count !== 1) return false;

  const language = normalizeTelegramLanguage(account.user?.language);
  try {
    const sent = await sendTelegramMessage(account.telegramId, telegramText(language, "bookingRefundRequired"), {
      reply_markup: {
        inline_keyboard: [[{
          text: telegramText(language, "searchAgain"),
          callback_data: "search:start",
        }]],
      },
    });
    if (sent) return true;
    await prisma.payment.updateMany({
      where: { id: payment.id, telegramNotifiedAt: { not: null } },
      data: { telegramNotifiedAt: null },
    });
    return false;
  } catch (error) {
    await prisma.payment.updateMany({
      where: { id: payment.id, telegramNotifiedAt: { not: null } },
      data: { telegramNotifiedAt: null },
    });
    throw error;
  }
};