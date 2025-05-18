const mongoose = require('mongoose');
const settingSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Learnova'
  },
  siteLogo: {
    type: String,
    default: 'https://via.placeholder.com/150x50/eeeeee/555555?text=Logo'
  },
  siteEmail: {
    type: String,
    default: 'admin@example.com'
  },
  // Contact //اضافي للتطوير لاحقا الان حيكون ستاتيك
  contactSection: {
  title: {
    type: String,
    default: 'Contact Us'
  },
  heading: {
    type: String,
    default: 'Feel free to contact us anytime'
  },
  description: {
    type: String,
    default: 'Thank you for choosing our templates...'
  },
  specialOffer: {
    text: {
      type: String,
      default: 'Special Offer 50% OFF!'
    },
    offerAmount: {
      type: String,
      default: '50%'
    },
    validUntil: {
      type: Date
    },
    link: {
      type: String
    }
  }
},
// Header sliderItems
 sliderItems: [
  {
    backgroundImage: { type: String, default: 'https://via.placeholder.com/1200x500?text=Slide+1' },
    category: { type: String, default: 'Our Courses' },
    title: { type: String, default: 'With Scholar Teachers, Everything Is Easier' },
    description: { type: String, default: 'Scholar is free CSS template designed by TemplateMo for online educational related websites.' },
    mainButtonText: { type: String, default: 'Request Demo' },
    mainButtonLink: { type: String, default: '#' },
    iconButtonText: { type: String, default: "What's Scholar?" },
    iconButtonLink: { type: String, default: '#' }
  }
],
// about Section
  aboutSection: {
  title: {
    type: String,
    default: 'About Us'
  },
  heading: {
    type: String,
    default: 'What makes us the best academy online?'
  },
  description: {
    type: String,
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...'
  },
  buttonText: {
    type: String,
    default: 'Discover More'
  },
  // about Section حخليه ستاتيك حاليا 
  accordion: [
    {
      question: String,
      answer: String
    }
  ]
},
// الروابط لاستخدامهم في الفوتر 
socialLinks: {
  facebook: { type: String, default: 'https://facebook.com/yourpage' },
  twitter: { type: String, default: 'https://twitter.com/yourpage' },
  instagram: { type: String, default: 'https://instagram.com/yourpage' },
  linkedin: { type: String, default: 'https://linkedin.com/in/yourpage' }
},
// حخليه ستاتيك حاليا
  footerText: {
    type: String,
    default: '© 2025 Learnova Platform. All rights reserved.'
  },
// لاحقا
  defaultLanguage: {
    type: String,
    enum: ['en', 'ar'],
    default: 'en'
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });


 module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
