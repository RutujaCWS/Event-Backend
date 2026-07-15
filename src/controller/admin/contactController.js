import Contact from "../../model/contactSchema.js";

// Get Contact
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne();

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Save / Update Contact
export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      {},
      {
        address: req.body.address,
        phone: req.body.phone,
        email: req.body.email,
        workingHours: req.body.workingHours,
        mapLink: req.body.mapLink,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};