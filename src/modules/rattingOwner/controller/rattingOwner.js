import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const rattingOwner = asyncHandler(async (req, res) => {
  const ownerId = req.owner._id;
  const month = parseInt(req.query.month); // تأكد من أن الشهر مرسل كعدد صحيح

  // تجميع المعلومات الثابتة للحسابات العامة
  const generalData = await tripLeaderModel.aggregate([
    { $match: { ownerId } },
    {
      $group: {
        _id: null,
        averageOfAverageRatings: { $avg: "$averageRating" },
        totalTripsCruise: { $sum: "$tripsCounter" },
        totalTripsAirFlight: { $sum: "$tripAirFlightCount" },
        Passengers: { $sum: "$NumberOfPassengers" },
      },
    },
  ]);

  // تجميع التقييمات وتصفيتها بناءً على الشهر
  const ratingsData = await tripLeaderModel.aggregate([
    { $match: { ownerId } },
    {
      $lookup: {
        from: "ratings", // اسم مجموعة الـ "Rating" في MongoDB
        localField: "ratings",
        foreignField: "_id",
        as: "ratings",
      },
    },
    { $unwind: "$ratings" }, // فك التجميع للتقييمات الفردية
    {
      $addFields: {
        ratingMonth: { $month: "$ratings.createdAt" }, // استخراج الشهر من `createdAt`
      },
    },
    { $match: { ratingMonth: month } }, // تصفية التقييمات بناءً على الشهر
    {
      $group: {
        _id: null,
        ratings: { $push: "$ratings" }, // إعادة تجميع التقييمات
      },
    },
  ]);

  // حساب المتوسط العام للتقييمات
  const overallAverage = generalData.length > 0 ? generalData[0].averageOfAverageRatings.toFixed(2) : 0;

  res.status(200).json({
    ownerId,
    averageOfAverageRatings: overallAverage,
    totalTripsCruise: generalData.length > 0 ? generalData[0].totalTripsCruise : 0,
    totalTripsAirFlight: generalData.length > 0 ? generalData[0].totalTripsAirFlight : 0,
    Passengers: generalData.length > 0 ? generalData[0].Passengers : 0,
    ratings: ratingsData.length > 0 ? ratingsData[0].ratings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : [], // فرز التقييمات حسب `createdAt`
  });
});


