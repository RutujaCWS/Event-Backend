import CMS from "../../model/cmsSchema.js";
import cloudinary from "../../config/cloudinary.js";

export const getCmsSection = async (req, res) => {
  try {
    const data = await CMS.findOne({
      section: req.params.section,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCmsSection = async (req, res) => {
  try {
    const { section } = req.params;

    const content = {
      ...req.body,
    };

    console.log(req.body);
    console.log(req.files);

    const updated = await CMS.findOneAndUpdate(
      { section },
      {
        section,
        content,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateLogo = async (req, res) => {
  try {
    let logoUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "event-management/logo",
        }
      );

      logoUrl = result.secure_url;
    }

    const updated = await CMS.findOneAndUpdate(
      { section: "logo" },
      {
        section: "logo",
        content: {
          logo: logoUrl,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Logo updated successfully",
      data: updated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};