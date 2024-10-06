const mongoose = require('mongoose');

// Define the BatchDetail schema
const batchDetailSchema = new mongoose.Schema({
  Batch_ID: { type: String},
  Batch_No: { type: String},
  Bill_No: { type: String, default: '' },
  Available_Quantity: { type: Number},
  Bill_ID: { type: String},
  Garden: { type: String},
  Grade: { type: String},
  Qty_per_Bag: { type: String, default: '' },
  Sale_Broker_Lot: { type: String, default: '' },
  W_h: { type: String, default: '' }
},{timestamps: true});

// Define the Item schema
const itemSchema = new mongoose.Schema({
  Item_ID: { type: String},
  Product_Name: { type: String},
  Batch_Details: [batchDetailSchema] // Array of BatchDetail subdocuments
},{timestamps: true});

// Create the models
const Item = mongoose.model('Item', itemSchema);
const BatchDetail = mongoose.model('BatchDetail', batchDetailSchema);

module.exports = { Item, BatchDetail };
