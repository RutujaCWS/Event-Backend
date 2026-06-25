import Gallery from "../../model/gallerySchema.js";

import cloudinary from "../../config/cloudinary.js";

export const createGalleryEvent = async (req, res) => {
  try {
    //console.log("BODY:", req.body);
    //console.log("FILE:", req.file);

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "gallery",
        }
      );

      imageUrl = result.secure_url;
    }

    const gallery = await Gallery.create({
      eventName: req.body.eventName,
      category: req.body.category,
      location: req.body.location,
      description: req.body.description,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Gallery event created successfully",
      data: gallery,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGalleryEvents = async (req, res) => {
  try {
    const galleryEvents = await Gallery.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: galleryEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGalleryEventById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateGalleryEvent = async (req, res) => {
  try {
    const updateData = {
      eventName: req.body.eventName,
      category: req.body.category,
      location: req.body.location,
      description: req.body.description,
    };

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "gallery",
        }
      );

      updateData.image = result.secure_url;
    }

    const updatedEvent = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Gallery event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteGalleryEvent = async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndDelete(
      req.params.id
    );

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Gallery event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};