const express = require("express");
const subformController = require("../controllers/subform");
const productController = require("../controllers/product");
const editSubformController = require("../controllers/editSubform");
const syncController = require("../controllers/sync");
const router = express.Router();

// subform routes
router.get("/gardens", subformController.getGardens);
router.post("/grades", subformController.getGradesByGarden);
router.post("/documents", subformController.getDocumentsByGardenAndGrade);
router.post("/creator", subformController.sendDataToZohoCreator);
router.put("/creator/:id", subformController.updateDataToZohoCreator);
router.get("/main", subformController.getSubFormData);
router.get("/all", subformController.getJSONData);

// product routes

router.get("/items", productController.getItems);
router.get("/item-names", productController.getItemNames);
router.post("/item-detail", productController.getItemDetail);

// edit subform routes
router.post("/webhook/:id", editSubformController.webhook);
router.get("/creator/edit/:id", editSubformController.creatorEdit);
router.get("/gardens/edit", editSubformController.getGardens);
router.get("/creator/get", editSubformController.getCreator);
router.post("/grades/edit", editSubformController.getGradesByGarden);
router.post(
  "/documents/edit/:id",
  editSubformController.getDocumentsByGardenAndGrade
);
router.get("/package/edit/:id", editSubformController.getSelectedPackages);

// edit sync

router.get("/sync", syncController.createSync);
router.get("/sync/last", syncController.getLastSyncTime);

module.exports = router;
