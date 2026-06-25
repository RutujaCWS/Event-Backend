import AdminSettings from "../../model/adminSettingsSchema.js";

// Get tax & discount settings
export const getTaxDiscountSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      return res.status(200).json({
        cgstRate: 9,
        sgstRate: 9,
        defaultDiscountValue: 0
      });
    }
    
    res.status(200).json(settings.taxDiscount);
  } catch (error) {
    console.error("Error fetching tax settings:", error);
    res.status(500).json({ error: "Failed to fetch tax settings" });
  }
};

// Update tax & discount settings
export const updateTaxDiscountSettings = async (req, res) => {
  try {
    const { cgstRate, sgstRate, defaultDiscountValue } = req.body;
    
    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      settings = await AdminSettings.create({
        taxDiscount: { cgstRate, sgstRate, defaultDiscountValue }
      });
    } else {
      settings = await AdminSettings.findOneAndUpdate(
        {},
        { taxDiscount: { cgstRate, sgstRate, defaultDiscountValue } },
        { new: true }
      );
    }
    
    res.status(200).json({
      success: true,
      message: "Tax & discount settings saved successfully!",
      data: settings.taxDiscount
    });
  } catch (error) {
    console.error("Error updating tax settings:", error);
    res.status(500).json({ error: "Failed to save tax settings" });
  }
};