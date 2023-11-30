import { configureStore } from "@reduxjs/toolkit";
import promotionSlice from "./modules/promotion/promotionSlice";
import shareSlice from "./shares/shareSlice";
import adminSlice from "./modules/admin/adminSlice";
import userSlice from "./modules/user/userSlice";
import categorySlice from "./modules/category/categorySlice";
import itemSlice from "./modules/item/itemSlice";
import deliverySlice from "./modules/delivery/deliverySlice";
import mediaSlice from "./modules/media/mediaSlice";
import pointSlice from "./modules/point/pointSlice";
import orderSlice from "./modules/order/orderSlice";
import faqSlice from "./modules/faq/faqSlice";
import regionSlice from "./modules/region/regionSlice";
import shopSlice from "./modules/shop/shopSlice";

export const stores = configureStore({
   reducer: {
    promotion: promotionSlice,
    share: shareSlice,
    admin: adminSlice,
    user: userSlice,
    category: categorySlice,
    item: itemSlice,
    delivery: deliverySlice,
    media: mediaSlice,
    point: pointSlice,
    order: orderSlice,
    faq: faqSlice,
    region: regionSlice,
    shop: shopSlice
   },
   middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false
  })

})