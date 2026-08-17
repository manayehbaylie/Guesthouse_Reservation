
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import {
  MapPin,
  Star,
  Users,
  Bed,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  Building2,
  Calendar,
  ArrowRight,
} from "lucide-react";

export function GuesthouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadGuesthouse = async () => {
      setLoading(true);
      setError("");

      try {
        const gh = await ApiService.getGuesthouseById(id);

        if (!gh) {
          throw new Error("Guesthouse not found.");
        }

        if (
          String(gh.status || "").toLowerCase() !==
          "approved"
        ) {
          throw new Error(
            "This guesthouse has not been verified by the administrator."
          );
        }

        const roomList = await ApiService.getRoomsForGuesthouse(
          gh.id
        );

        const availableRooms = (roomList || []).filter(
          (room) =>
            String(
              room.availabilityStatus ||
                room.status ||
                ""
            ).toLowerCase() === "available"
        );

        if (mounted) {
          setGuesthouse(gh);
          setRooms(availableRooms);
        }
      } catch (err) {
        console.error(
          "Failed to load guesthouse:",
          err
        );

        if (mounted) {
          setGuesthouse(null);
          setRooms([]);
          setError(
            err?.message ||
              "Unable to load this guesthouse."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGuesthouse();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSelectRoom = (roomId) => {
    navigate(
      `/booking?guesthouseId=${encodeURIComponent(
        guesthouse.id
      )}&roomId=${encodeURIComponent(roomId)}`
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-10 w-40 bg-stone-200 rounded-xl animate-pulse mb-6" />

        <div className="h-12 w-96 max-w-full bg-stone-200 rounded-xl animate-pulse mb-3" />

        <div className="h-5 w-72 bg-stone-200 rounded-xl animate-pulse mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 sm:h-96 bg-stone-200 rounded-3xl animate-pulse" />
          <div className="h-80 sm:h-96 bg-stone-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!guesthouse) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Building2 className="w-12 h-12 text-stone-300 mx-auto" />

        <h2 className="text-xl font-black text-stone-900 mt-4">
          Verified Guesthouse Not Found
        </h2>

        <p className="text-xs text-stone-500 mt-2">
          {error ||
            "This guesthouse does not exist or has not been approved."}
        </p>

        <button
          onClick={() => navigate("/search")}
          className="mt-6 px-5 py-3 bg-amber-500 hover:bg-amber-400 rounded-xl text-xs font-black text-stone-950"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const images =
    guesthouse.images?.length > 0
      ? guesthouse.images
      : [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        ];

  const amenities = Array.isArray(guesthouse.amenities)
    ? guesthouse.amenities
    : [];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to listings
        </button>

        {/* Header */}
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Guesthouse
            </span>

            <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              {guesthouse.rating ?? "4.5"}
            </span>

            {guesthouse.reviewCount > 0 && (
              <span className="text-[10px] text-stone-400">
                {guesthouse.reviewCount} reviews
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 mt-3">
            {guesthouse.name}
          </h1>

          <p className="text-xs text-stone-500 flex items-center gap-1 mt-2">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />

            {guesthouse.address ||
              guesthouse.location ||
              "Location unavailable"}

            {guesthouse.city
              ? `, ${guesthouse.city}`
              : ""}
          </p>
        </section>

        {/* Images */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 sm:h-96 rounded-3xl overflow-hidden bg-stone-100">
            <img
              src={images[activeImageIndex] || images[0]}
              alt={guesthouse.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 h-80 sm:h-96">
            {images.slice(0, 4).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() =>
                  setActiveImageIndex(index)
                }
                className={`rounded-2xl overflow-hidden border-2 ${
                  activeImageIndex === index
                    ? "border-amber-500"
                    : "border-transparent"
                }`}
              >
                <img
                  src={image}
                  alt={`${guesthouse.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <section className="bg-white p-6 rounded-3xl border border-stone-200">
              <h2 className="text-lg font-black text-stone-900 mb-3">
                About this Guesthouse
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {guesthouse.description ||
                  "No description has been provided for this guesthouse."}
              </p>
            </section>

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="bg-white p-6 rounded-3xl border border-stone-200">
                <h2 className="text-lg font-black text-stone-900 mb-4">
                  Amenities &amp; Services
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 text-xs font-semibold text-stone-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Available rooms */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-stone-900">
                  Available Rooms
                </h2>

                <p className="text-xs text-stone-500 mt-1">
                  Select a room to continue with your reservation.
                </p>
              </div>

              {rooms.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center">
                  <Calendar className="w-10 h-10 text-stone-300 mx-auto" />

                  <h3 className="font-bold mt-3">
                    No Rooms Available
                  </h3>

                  <p className="text-xs text-stone-500 mt-1">
                    There are currently no available rooms in this
                    guesthouse.
                  </p>

                  <button
                    onClick={() => navigate("/search")}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold"
                  >
                    Find Another Guesthouse
                  </button>
                </div>
              ) : (
                rooms.map((room) => {
                  const price = Number(
                    room.pricePerNight ??
                      room.price ??
                      0
                  );

                  return (
                    <div
                      key={room.id}
                      className="bg-white p-5 rounded-3xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Bed className="w-5 h-5 text-amber-600" />

                          <b className="text-sm text-stone-900">
                            Room {room.roomNumber}
                          </b>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-3">
                          <span>
                            <Users className="inline w-3.5 h-3.5 mr-1" />
                            Max {room.capacity} guest
                            {Number(room.capacity) !== 1
                              ? "s"
                              : ""}
                          </span>

                          <span>
                            <Bed className="inline w-3.5 h-3.5 mr-1" />
                            {room.type ||
                              room.roomType}
                          </span>

                          <span className="text-emerald-600 font-semibold">
                            Available
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="text-right">
                          <b className="text-lg text-stone-900">
                            {price.toLocaleString()} ETB
                          </b>

                          <div className="text-[10px] text-stone-400">
                            per night
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleSelectRoom(room.id)
                          }
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-2"
                        >
                          Select &amp; Book
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>

          {/* Verification sidebar */}
          <aside>
            <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl space-y-5 sticky top-24">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Verified Guarantee
              </h3>

              <p className="text-xs text-stone-300 leading-relaxed">
                This guesthouse has been approved by the platform
                administrator. Only verified properties are displayed
                to guests.
              </p>

              <div className="pt-4 border-t border-stone-800 space-y-3 text-xs text-stone-400">
                {guesthouse.phone && (
                  <div>
                    <Phone className="inline w-4 h-4 text-amber-400 mr-2" />
                    {guesthouse.phone}
                  </div>
                )}

                {guesthouse.email && (
                  <div>
                    <Mail className="inline w-4 h-4 text-amber-400 mr-2" />
                    {guesthouse.email}
                  </div>
                )}

                {!guesthouse.phone &&
                  !guesthouse.email && (
                    <div className="text-stone-500">
                      Contact information is not available.
                    </div>
                  )}
              </div>

              <div className="pt-4 border-t border-stone-800">
                <div className="flex items-start gap-2 text-[10px] text-stone-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                  <span>
                    Room availability is checked before the
                    reservation is created to help prevent
                    double booking.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

