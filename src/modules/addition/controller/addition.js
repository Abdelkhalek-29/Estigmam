import additionModel from "../../../../DB/model/addition.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addAddition = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    const { _id } = req.owner;
    const addition = await additionModel.create({
        name,
        owner: _id,
    });
  const { secure_url ,public_id} = await cloudinary.uploader.upload(
    req.file.path, {
    folder: `${process.env.FOLDER_CLOUDINARY}/addition/${addition.owner}`,
  }
  );
  addition.Image = { url: secure_url, id: public_id };
  await addition.save();

  
    return res.status(201).json({ addition });
})
 
export const getAdditions = asyncHandler(async (req, res, next) => {
    const additions = await additionModel.find();
    return res.status(200).json({ additions });
});

export const getAddition = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const addition = await additionModel.findById(id);
    return res.status(200).json({ addition });
});

export const updateAddition = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const addition = await additionModel.findById(id);
    if (!addition) {
        return next(new Error("Addition not found!", { cause: 404 }));
  }
  const { name, price } = req.body;
  addition.name = name|| addition.name;
  addition.price = price|| addition.price;
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        public_id: addition.Image.id,
      }
    );
    addition.Image.url = secure_url;
  }

  await addition.save();
  return res.status(200).json({ addition });
}
);

export const deleteAddition = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const addition = await additionModel.findById(id);
    if (!addition) {
        return next(new Error("Addition not found!", { cause: 404 }));
  }
  await addition.remove();
  await cloudinary.uploader.destroy(addition.Image.id);

  return res.status(200).json({ message: "Addition deleted successfully!" });

});

