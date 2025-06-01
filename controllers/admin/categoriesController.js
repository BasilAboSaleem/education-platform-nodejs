const {
  User, Student, Teachers, Category, Course, Lesson, Payment, Enrollment, Notification, Setting, Task,
  check, validationResult, bcrypt, jwt, moment, multer, upload,
  cloudinary, fs, model, path, Parser, send, title, uuidv4,
} = require('./utils');


  admin_add_category_get = async (req,res) => {
    try{
    res.render("pages/admin/categories/add-categorie", {moment: moment})

    }
    catch(err){
      console.log(err); 
      res.status(500).send("Error while rendering add category page");

    }
  }
  admin_add_category_post = async (req, res) => {
    try {
      cloudinary.uploader.upload(req.file.path,{folder: "LMS/categoriesImge"} ,async (error, result) => {
        if (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return res.status(500).send("Error uploading image");
        }
  
        const uploadedImage = result.secure_url; // رابط الصورة المرفوعة
        req.body.image = uploadedImage; // إضافة رابط الصورة إلى البيانات المدخلة
        //التاكد من عدم تكرار الاسم 
        const existingCategory = await Category.findOne({ name: req.body.name });
        if (existingCategory) {
          console.log("Category name already exists");
          //اظهار رسالة الخطا للمسخدم في الواجهة
          req.flash('error', 'Category name already exists'); // تخزين رسالة الخطأ في الجلسة
          return res.redirect('/admin/categories/add-category'); // إعادة التوجيه مع رسالة الخطأ
        }
        const newCategory = await Category.create({
          name: req.body.name,
          description: req.body.description,
          image: uploadedImage,
        });
        fs.unlinkSync(req.file.path); // حذف الملف المؤقت
        //اظهار رسالة النجاح للمستخدم في الفرونت
        req.flash('success', 'Category added successfully'); // تخزين رسالة النجاح في الجلسة


        console.log("New category added:", newCategory);
        res.redirect("/admin/categories");
      });
  
    } catch (err) {
      console.log(err);
      res.status(500).send("Error while adding category");
    }
  };
  admin_categories_get = async (req,res) => {
    try{
      const categories = await Category.find().sort({createdAt: -1}).lean() // هlean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
      res.locals.categories = categories
        res.render("pages/admin/categories/categories", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_view_get = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id).lean()
      res.locals.category = category
      res.render("pages/admin/categories/categories_view", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_edit_get = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id).lean()
      res.locals.category = category
      res.render("pages/admin/categories/categories_edite", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت

    }
    catch(err){
        console.log(err)
    }

  }
  admin_categories_edit_put = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id)
      //فحص اذا تم رفع صورة جديدة ام لا 
      if(req.file){
        cloudinary.uploader.upload(req.file.path,{folder: "LMS/categoriesImge"} ,async (error, result) => {
          if (error) {
            console.error("Error uploading image to Cloudinary:", error);
            return res.status(500).send("Error uploading image");
          }
          const uploadedImage = result.secure_url; // رابط الصورة المرفوعة
          req.body.image = uploadedImage; // إضافة رابط الصورة إلى البيانات المدخلة
          const updatedCategory = await Category.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            description: req.body.description,
            status: req.body.status,
            image: uploadedImage,
          }, { new: true });
          fs.unlinkSync(req.file.path); // حذف الملف المؤقت
          res.redirect("/admin/categories")
        });
      }else{
        //اذا لم يتم تحديث الصورة حدث هدول وبس
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, {
          name: req.body.name,
          description: req.body.description,
          status: req.body.status,
        }, { new: true });
        res.redirect("/admin/categories")
      }

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_delete = async (req,res) => {
    try{
      const category = await Category.findById(req.params.id)
      //حذف الصورة من الكلاودنري
      const publicId = category.image.split('/').pop().split('.')[0]; // استخراج الـ public_id من رابط الصورة
      await cloudinary.uploader.destroy(`LMS/categoriesImge/${publicId}`); // حذف الصورة من Cloudinary
      //حذف الفئة من قاعدة البيانات
      await Category.findByIdAndDelete(req.params.id)
      res.redirect("/admin/categories")

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_status_put = async (req, res) => {
    try{
      const categorie = await Category.findById(req.params.id);
      if(categorie.status === "Active"){
        await Category.findByIdAndUpdate(req.params.id, { status: "Inactive" }, { new: true });
      } else {
        await Category.findByIdAndUpdate(req.params.id, { status: "Active" }, { new: true });
      }
      res.redirect("/admin/categories");

    }
    catch(err){
        console.log(err)
    }
  }
  admin_categories_search_get = async (req,res) => {
    try{
      const categories = await Category.find().sort({createdAt: -1}).lean() //populate هيك صار يدمج مودل اليوزر مع مودل الستودنت وبقدر اوصل لبيانات الاثنين lean سرعة في عرض البيانات sort ترتيب حسب التاريخ الاحدث فوق والاقدم تحت
      res.locals.categories = categories
        res.render("pages/admin/categories/categories_search", {moment: moment}) //moment مكتبة لتنسيق التاريخ والوقت


    }
    catch(err){
      console.log(err);
    }
  }
  
  admin_categories_search_post = async (req, res) => {
    try{
      const query = req.body.query?.trim()
      if (!query) {
        return res.render("pages/admin/categories/categories_search", { categories: [], moment });
      }


      const categories = await Category.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
         
        ]
      }).sort({ createdAt: -1 }).lean();
      res.render("pages/admin/categories/categories_search", { categories, moment });
    }
    catch(err){
        console.log(err)
    }
  }
  
module.exports = {
  admin_add_category_get,
  admin_add_category_post,
  admin_categories_get,
  admin_categories_view_get,
  admin_categories_edit_get,
  admin_categories_edit_put,
  admin_categories_delete,
  admin_categories_status_put,
  admin_categories_search_get,
  admin_categories_search_post
};