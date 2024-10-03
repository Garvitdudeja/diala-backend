const mongoose = require('mongoose');

// Define the BatchDetail schema
const batchDetailSchema = new mongoose.Schema({
  Batch_ID: { type: String, required: true },
  Batch_No: { type: String, required: true },
  Bill_No: { type: String, default: '' },
  Available_Quantity: { type: Number, required: true },
  Bill_ID: { type: String, required: true },
  Garden: { type: String, required: true },
  Grade: { type: String, required: true },
  Qty_per_Bag: { type: String, default: '' },
  Sale_Broker_Lot: { type: String, default: '' },
  W_h: { type: String, default: '' }
},{timestamps: true});

// Define the Item schema
const itemSchema = new mongoose.Schema({
  Item_ID: { type: String, required: true },
  Product_Name: { type: String, required: true },
  Batch_Details: [batchDetailSchema] // Array of BatchDetail subdocuments
},{timestamps: true});

// Create the models
const Item = mongoose.model('Item', itemSchema);
const BatchDetail = mongoose.model('BatchDetail', batchDetailSchema);

module.exports = { Item, BatchDetail };
