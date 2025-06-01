const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


admin_settings_get = async (req, res) => {
  try{
    let  settings = await Setting.findOne(); // Assuming you have a Setting model
    if (!settings) {
    settings = {
      siteName: '',
      siteEmail: '',
      defaultLanguage: 'en',
      allowRegistration: false,
      maintenanceMode: false,
      contactSection: {
        title: '',
        heading: '',
        description: '',
        specialOffer: {
          text: '',
          offerAmount: '',
          validUntil: null,
          link: ''
        }
      },
      sliderItems: [],
      aboutSection: {
        title: '',
        heading: '',
        description: '',
        buttonText: '',
        accordion: []
      },
      footerText: '',
      socialLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      }
    };
  }
    res.render("pages/admin/settings/system-settings", { settings, moment , logo: settings.siteLogo || '' });

  }
  catch(err){
    console.log(err);
    res.status(500).send('Error loading system settings');
  }
}

admin_settings_put = async (req, res) => {
  try {
    // يحول القيمة القادمة من الفورم إلى قيمة منطقية (true أو false) بشكل آمن
    const parseBoolean = (value, fallback = false) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return ['true', 'on', '1'].includes(value.toLowerCase());
      }
      return fallback;
    };
  let settings = await Setting.findOne(); 
  //اذا فشي ستينج انشئ واحد جديد
  if(!settings){
    settings = new Setting();
  }
  //جلب البيانات الجديدة من الفورم
  const body = req.body;

  // الحقول العامة
  settings.siteName = body.siteName || settings.siteName;
  settings.siteEmail = body.siteEmail || settings.siteEmail;
  settings.siteLogo = body.siteLogo || settings.siteLogo;
  
  // حقول aboutSection
  settings.aboutSection.title = body.aboutSection.title || settings.aboutSection.title;
  settings.aboutSection.heading = body.aboutSection.heading || settings.aboutSection.heading;
  settings.aboutSection.description = body.aboutSection.description || settings.aboutSection.description;
  settings.aboutSection.buttonText = body.aboutSection.buttonText || settings.aboutSection.buttonText;

   //  حقول sliderItems 
      // معالجة السلايدرات
    let newSliderItems = [];
    const oldSliderItems = settings.sliderItems || [];

    if (body.sliderItems) {
      const inputSlides = Array.isArray(body.sliderItems) ? body.sliderItems : Object.values(body.sliderItems);

      for (let slide of inputSlides) {
        if (slide._id) {
          // تعديل سلايد موجود
          const existing = oldSliderItems.find(s => s._id == slide._id);
          if (existing) {
            existing.backgroundImage = slide.backgroundImage || '';
            existing.category = slide.category || '';
            existing.title = slide.title || '';
            existing.description = slide.description || '';
            existing.mainButtonText = slide.mainButtonText || '';
            existing.mainButtonLink = slide.mainButtonLink || '';
            existing.iconButtonText = slide.iconButtonText || '';
            existing.iconButtonLink = slide.iconButtonLink || '';
            newSliderItems.push(existing);
          }
        } else {
          // سلايد جديد
          newSliderItems.push({
            _id: uuidv4(),
            backgroundImage: slide.backgroundImage || '',
            category: slide.category || '',
            title: slide.title || '',
            description: slide.description || '',
            mainButtonText: slide.mainButtonText || '',
            mainButtonLink: slide.mainButtonLink || '',
            iconButtonText: slide.iconButtonText || '',
            iconButtonLink: slide.iconButtonLink || ''
          });
        }
      }
    }

    settings.sliderItems = newSliderItems;
  // حقول socialLinks
 if (body.socialLinks) {
  settings.socialLinks.facebook = body.socialLinks.facebook || settings.socialLinks.facebook;
  settings.socialLinks.twitter = body.socialLinks.twitter || settings.socialLinks.twitter;
  settings.socialLinks.instagram = body.socialLinks.instagram || settings.socialLinks.instagram;
  settings.socialLinks.linkedin = body.socialLinks.linkedin || settings.socialLinks.linkedin;
} else {
  // لو body.socialLinks مش موجود، نحافظ على القيم القديمة بدون تغيير
  settings.socialLinks.facebook = settings.socialLinks.facebook;
  settings.socialLinks.twitter = settings.socialLinks.twitter;
  settings.socialLinks.instagram = settings.socialLinks.instagram;
  settings.socialLinks.linkedin = settings.socialLinks.linkedin;
}
     // boolean fields
    settings.allowRegistration = parseBoolean(body.allowRegistration, settings.allowRegistration);
    settings.maintenanceMode = parseBoolean(body.maintenanceMode, settings.maintenanceMode);
 
    
    // contactSection
settings.contactSection.title = body.contactSection?.title || settings.contactSection.title;
settings.contactSection.heading = body.contactSection?.heading || settings.contactSection.heading;
settings.contactSection.description = body.contactSection?.description || settings.contactSection.description;

settings.contactSection.specialOffer.text = body.contactSection?.specialOffer?.text || settings.contactSection.specialOffer.text;
settings.contactSection.specialOffer.offerAmount = body.contactSection?.specialOffer?.offerAmount || settings.contactSection.specialOffer.offerAmount;
settings.contactSection.specialOffer.validUntil = body.contactSection?.specialOffer?.validUntil || settings.contactSection.specialOffer.validUntil;
settings.contactSection.specialOffer.link = body.contactSection?.specialOffer?.link || settings.contactSection.specialOffer.link;
    // footer
    settings.footerText = body.footerText || settings.footerText;

    // defaultLanguage
    const allowedLanguages = ['en', 'ar'];
    if (allowedLanguages.includes(body.defaultLanguage)) {
      settings.defaultLanguage = body.defaultLanguage;
    }

    //حفظ الاعدادات
     await settings.save();
    req.flash('success', 'System settings updated successfully');
    res.redirect('/dashboard');

  }
  catch(err){
    console.log(err);
    res.status(500).send('Error updating system settings');
  }
}

module.exports = {
  admin_settings_get,
  admin_settings_put
};