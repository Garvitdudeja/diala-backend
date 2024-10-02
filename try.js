const express = require("express");
const app = express();

app.use((req, res, next) => {
  let dataSize = 0;

  req.on("data", (chunk) => {
    dataSize += chunk.length;
  });

  req.on("end", () => {
    console.log(`Incoming request size: ${dataSize} bytes`);
    next();
  });
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// app.use(express.json());

app.get("/sleep", (req, res) => {
  setTimeout(() => {
    res.status(200).send({ status: true });
  }, 1000);
});

app.post("/api", (req, res) => {
  const { totalQty } = req?.body;
  const data = req?.body?.input;
  const mergedData = data.reduce((acc, obj) => {
    const { name, quantity_consumed, batches, ...rest } = obj;
    if (!acc[name]) {
      acc[name] = { name, quantity_consumed, ...rest, batches: [] };
    }
    acc[name].batches.push(...batches);
    return acc;
  }, {});

  // Adjusting quantity_consumed based on out_quantity and totalQty
  Object.values(mergedData).forEach((item) => {
    if (item.batches.length > 0) {
      const totalOutQuantity = item.batches.reduce(
        (total, batch) => total + batch.out_quantity,
        0
      );

      // Only proceed if totalOutQuantity is not equal to totalQty
      if (totalOutQuantity !== totalQty) {
        const quantityConsumed = (totalOutQuantity / totalQty).toFixed(12); // Ensure enough digits for precision
        const sixDigitsAfterDecimal = quantityConsumed.substring(
          quantityConsumed.indexOf(".") + 1,
          quantityConsumed.indexOf(".") + 7
        );
        item.quantity_consumed = parseFloat(`0.${sixDigitsAfterDecimal}`);
      }
    }
  });

  Object.values(mergedData).forEach((item) => {
    if (item.batches.length > 0) {
      const totalOutQuantity = item.batches.reduce(
        (total, batch) => total + batch.out_quantity,
        0
      );
      const expectedQuantity = item.quantity_consumed * totalQty;
      if (totalOutQuantity !== expectedQuantity) {
        // If totalOutQuantity is not equal to expectedQuantity, adjust one batch quantity
        var difference = expectedQuantity - totalOutQuantity;
        if (difference > 0) {
          // If difference is positive, increase one batch quantity
          let adjusted = false;
          for (let i = 0; i < item.batches.length; i++) {
            if (!adjusted) {
              const remainingQuantity = totalQty - item.batches[i].out_quantity;
              if (remainingQuantity >= difference) {
                item.batches[i].out_quantity += difference;
                adjusted = true;
              }
            }
          }
        } else {
          // If difference is negative, decrease one batch quantity
          let adjusted = false;
          for (let i = 0; i < item.batches.length; i++) {
            if (!adjusted) {
              if (item.batches[i].out_quantity >= -difference) {
                item.batches[i].out_quantity += difference;
                adjusted = true;
              } else {
                item.batches[i].out_quantity = 0;
                difference += item.batches[i].out_quantity;
              }
            }
          }
        }
      }
    }
  });
  const result1 = Object.values(mergedData);
  res.status(200).send(result1);
});

app.listen(2000, () => {
  console.log("server is running");
});
