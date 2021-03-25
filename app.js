const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-georgi:Test123@cluster0.meb8u.mongodb.net/todolistDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Buy Food"
});
const item2 = new Item({
  name: "Cook Food"
});
const item3 = new Item({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find(function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  })
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, found) {
    if (!err) {
      if (!found) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: found.name,
          newListItems: found.items
        })
      }
    }
  })
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newPost = new Item({
    name: itemName
  })

  if (listName === "Today") {
    newPost.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, found) {
      found.items.push(newPost);
      found.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      }
    })
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, found) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
})

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
