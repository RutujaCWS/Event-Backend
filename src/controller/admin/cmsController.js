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

    if (section === "home") {
  // Upload Images
  if (req.files?.heroImage1?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.heroImage1[0].mimetype};base64,${req.files.heroImage1[0].buffer.toString("base64")}`,
      { folder: "event-management/home" }
    );
    content.heroImage1 = result.secure_url;
  }

  if (req.files?.heroImage2?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.heroImage2[0].mimetype};base64,${req.files.heroImage2[0].buffer.toString("base64")}`,
      { folder: "event-management/home" }
    );
    content.heroImage2 = result.secure_url;
  }

  if (req.files?.heroImage3?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.heroImage3[0].mimetype};base64,${req.files.heroImage3[0].buffer.toString("base64")}`,
      { folder: "event-management/home" }
    );
    content.heroImage3 = result.secure_url;
  }
}
    // Journey Images
    if (section === "journey") {
  if (req.files?.image1?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.image1[0].mimetype};base64,${req.files.image1[0].buffer.toString("base64")}`,
      { folder: "event-management/journey" }
    );
    content.image1 = result.secure_url;
  }

  if (req.files?.image2?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.image2[0].mimetype};base64,${req.files.image2[0].buffer.toString("base64")}`,
      { folder: "event-management/journey" }
    );
    content.image2 = result.secure_url;
  }

  if (req.files?.image3?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.image3[0].mimetype};base64,${req.files.image3[0].buffer.toString("base64")}`,
      { folder: "event-management/journey" }
    );
    content.image3 = result.secure_url;
  }

  if (req.files?.image4?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.image4[0].mimetype};base64,${req.files.image4[0].buffer.toString("base64")}`,
      { folder: "event-management/journey" }
    );
    content.image4 = result.secure_url;
  }
}

// Problem Image
if (section === "problem") {
  if (req.files?.problemImage?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.problemImage[0].mimetype};base64,${req.files.problemImage[0].buffer.toString("base64")}`,
      {
        folder: "event-management/problem",
      }
    );

    content.image = result.secure_url;
  }
}

if (section === "solution") {
  if (req.files?.solutionImage?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.solutionImage[0].mimetype};base64,${req.files.solutionImage[0].buffer.toString("base64")}`,
      {
        folder: "event-management/solution",
      }
    );

    content.image = result.secure_url;
  }
}
if (section === "why-choose-us") {
  if (req.files?.leftImage?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.leftImage[0].mimetype};base64,${req.files.leftImage[0].buffer.toString("base64")}`,
      { folder: "event-management/why-choose-us" }
    );

    content.leftImage = result.secure_url;
  }

  if (req.files?.rightImage?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.rightImage[0].mimetype};base64,${req.files.rightImage[0].buffer.toString("base64")}`,
      { folder: "event-management/why-choose-us" }
    );

    content.rightImage = result.secure_url;
  }
}
if (section === "banner") {
  if (req.files?.bannerImage?.[0]) {
    const result = await cloudinary.uploader.upload(
      `data:${req.files.bannerImage[0].mimetype};base64,${req.files.bannerImage[0].buffer.toString("base64")}`,
      {
        folder: "event-management/banner",
      }
    );

    content.bannerImage = result.secure_url;
  }
}
    // Preserve old images if no new image uploaded
    const existing = await CMS.findOne({ section });
 

    if (existing) {
// Banner Image
if (section === "banner") {
  if (!content.bannerImage) {
    content.bannerImage = existing.content.bannerImage;
  }
}
  // Home Images
  if (section === "home" && existing) {
  if (!content.heroImage1) content.heroImage1 = existing.content.heroImage1;
  if (!content.heroImage2) content.heroImage2 = existing.content.heroImage2;
  if (!content.heroImage3) content.heroImage3 = existing.content.heroImage3;
}

  // Journey Images
  if (section === "journey" && existing) {
  if (!content.image1) content.image1 = existing.content.image1;
  if (!content.image2) content.image2 = existing.content.image2;
  if (!content.image3) content.image3 = existing.content.image3;
  if (!content.image4) content.image4 = existing.content.image4;
}
  // Problem & Solution Image
if (section === "problem" && existing) {
  if (!content.image) {
    content.image = existing.content.image;
  }
}

if (section === "solution" && existing) {
  if (!content.image) {
    content.image = existing.content.image;
  }
}
  // Why Choose Us Images
if (section === "why-choose-us" && existing) {
  if (!content.leftImage)
    content.leftImage = existing.content.leftImage;

  if (!content.rightImage)
    content.rightImage = existing.content.rightImage;
}


}

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
     console.log(error);
  console.log(error.message);
  console.log(error.stack);
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