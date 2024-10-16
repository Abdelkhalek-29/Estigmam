import cron from 'node-cron';
import moment from 'moment'; 
import tripLeaderModel from "../../DB/model/tripLeader.model.js";
import toolModel from "../../DB/model/tool.model.js";
import notificationModel from '../../DB/model/notification.model.js';
import placesModel from '../../DB/model/places.model.js';
import OwnerModel from '../../DB/model/Owner.model .js';

export const checkExpirationsAndNotify = async () => {
  const today = moment();
  const oneWeekAhead = moment().add(7, 'days');

  try {
    const leaders = await tripLeaderModel.find({
      $or: [
        { expirationDate: { $gte: today.toDate(), $lte: oneWeekAhead.toDate() } },
        { IDExpireDate: { $gte: today.toDate(), $lte: oneWeekAhead.toDate() } },
      ]
    });

    for (let leader of leaders) {
      let notifications = [];

      if (leader.expirationDate && moment(leader.expirationDate).isBetween(today, oneWeekAhead)) {
        notifications.push({
          title: 'License Expiration Reminder',
          description: `Your license will expire on ${moment(leader.expirationDate).format('YYYY-MM-DD')}. Please update it.`,
          receiver: leader._id,
          receiverModel: 'TripLeader',
        });
      }

      if (leader.IDExpireDate && moment(leader.IDExpireDate).isBetween(today, oneWeekAhead)) {
        notifications.push({
          title: 'ID Expiration Reminder',
          description: `Your ID will expire on ${moment(leader.IDExpireDate).format('YYYY-MM-DD')}. Please update it.`,
          receiver: leader._id,
          receiverModel: 'TripLeader',
        });
      }

      if (notifications.length > 0) {
        await notificationModel.insertMany(notifications);
      }
    }

    const tools = await toolModel.find({
      licenseEndDate: { $gte: today.toDate(), $lte: oneWeekAhead.toDate() },
    });

    for (let tool of tools) {
      await notificationModel.create({
        title: 'Tool License Expiration Reminder',
        description: `The license for tool ${tool.name} will expire on ${moment(tool.licenseEndDate).format('YYYY-MM-DD')}. Please renew it.`,
        receiver: tool.createBy, 
        receiverModel: 'Owner',
      });
    }

    const places = await placesModel.find({
      ExpiryDate: { $gte: today.toDate(), $lte: oneWeekAhead.toDate() },
    });

    for (let place of places) {
      await notificationModel.create({
        title: 'Place License Expiration Reminder',
        description: `The license for place ${place.name} will expire on ${moment(place.ExpiryDate).format('YYYY-MM-DD')}. Please renew it.`,
        receiver: place.createBy, 
        receiverModel: 'Owner',
      });
    }

    const owners = await OwnerModel.find({
      IDExpireDate: { $gte: today.toDate(), $lte: oneWeekAhead.toDate() }
    });

    for (let owner of owners) {
      await notificationModel.create({
        title: 'ID Expiration Reminder',
        description: `Your ID will expire on ${moment(owner.IDExpireDate).format('YYYY-MM-DD')}. Please update it.`,
        receiver: owner._id,
        receiverModel: 'Owner',
      });
    }

  } catch (error) {
    console.error('Error checking expirations: ', error);
  }
};

cron.schedule('0 0 * * *', checkExpirationsAndNotify);
