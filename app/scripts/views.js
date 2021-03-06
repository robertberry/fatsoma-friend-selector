(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["models", "templates", "exceptions", "backbone_extensions", "utils", "backbone", "underscore", "jquery", "jquery_extensions"], function(models, templates, exceptions, extensions, utils, Backbone, _, $) {
    var exports;
    exports = {};
    exports.FriendSelector = (function(_super) {

      __extends(FriendSelector, _super);

      function FriendSelector() {
        FriendSelector.__super__.constructor.apply(this, arguments);
      }

      FriendSelector.prototype.template = templates.friend_selector;

      FriendSelector.prototype.initialize = function() {
        var focus_search, selected_friends,
          _this = this;
        this.friends = this.options["friends"];
        selected_friends = new models.Users(this.options["selected"]);
        this.selected = new exports.SelectedUsers({
          collection: selected_friends
        });
        this.selected.render();
        this.remaining_friends = new models.Users(this.friends.without(selected_friends.models));
        selected_friends.on("add", _.bind(this.remaining_friends.remove, this.remaining_friends));
        selected_friends.on("remove", _.bind(this.remaining_friends.add, this.remaining_friends));
        this.search = new exports.SearchInput;
        this.search.render();
        this.autocomplete = new exports.UserAutocomplete({
          collection: new models.Users,
          user_pool: this.remaining_friends
        });
        this.autocomplete.on("select", _.bind(this.select_user, this));
        focus_search = function() {
          var input;
          input = _this.search.$el;
          return input.get(0).focus();
        };
        this.selected.on("focus_search", focus_search);
        this.autocomplete.on("focus_input", focus_search);
        this.search.on("autocomplete", _.bind(this.autocomplete.filter, this.autocomplete));
        this.search.on("focus_autocomplete", function() {
          try {
            return _this.autocomplete.focus();
          } catch (_error) {}
        });
        this.search_focus_group = new utils.FocusGroup([this.search.el, this.autocomplete.el]);
        this.search_focus_group.on("focus", _.bind(this.autocomplete.show, this.autocomplete));
        this.search_focus_group.on("blur", _.bind(this.autocomplete.hide, this.autocomplete));
        this.selected_hidden = new exports.SelectedHiddenInputArray({
          collection: selected_friends
        });
        return this.selected_hidden.render();
      };

      FriendSelector.prototype.select_user = function(user) {
        this.selected.collection.add(user);
        return this.search.set_query("");
      };

      FriendSelector.prototype.render = function() {
        FriendSelector.__super__.render.apply(this, arguments);
        this.$(".selected").html(this.selected.el);
        this.$(".search_box").html(this.search.el);
        this.$(".autocomplete_box").html(this.autocomplete.el);
        this.$(".selected_hidden").html(this.selected_hidden.el);
        return this.autocomplete.render();
      };

      return FriendSelector;

    })(extensions.MustacheView);
    exports.SearchInput = (function(_super) {

      __extends(SearchInput, _super);

      function SearchInput() {
        SearchInput.__super__.constructor.apply(this, arguments);
      }

      SearchInput.prototype.tagName = "input";

      SearchInput.prototype.attributes = {
        type: "text",
        "class": "search",
        tabindex: 0
      };

      SearchInput.prototype.events = {
        "keyup": "on_key_up",
        "keydown": "on_key_down"
      };

      SearchInput.prototype.last_search = null;

      SearchInput.prototype.on_key_down = function(event) {
        var focus,
          _this = this;
        if (event.keyCode === utils.keyCodes.KEY_DOWN) {
          focus = function() {
            return _this.trigger("focus_autocomplete");
          };
          return setTimeout(focus, 1);
        }
      };

      SearchInput.prototype.on_key_up = function(event) {
        if (this.full_query() !== this.last_search) {
          this.last_search = this.full_query();
          return this.trigger("autocomplete", this.terms());
        }
      };

      SearchInput.prototype.full_query = function() {
        return this.$el.val() || "";
      };

      SearchInput.prototype.set_query = function(query) {
        this.$el.val(query);
        return this.trigger("autocomplete", this.terms());
      };

      SearchInput.prototype.terms = function() {
        return this.full_query().toLowerCase().split(/\s+/);
      };

      return SearchInput;

    })(Backbone.View);
    exports.UserAutocompleteItem = (function(_super) {

      __extends(UserAutocompleteItem, _super);

      function UserAutocompleteItem() {
        UserAutocompleteItem.__super__.constructor.apply(this, arguments);
      }

      UserAutocompleteItem.prototype.tagName = "li";

      UserAutocompleteItem.prototype.template = templates.user_autocomplete_item;

      UserAutocompleteItem.prototype.attributes = {
        tabindex: 0
      };

      UserAutocompleteItem.prototype.events = {
        "click": "on_click",
        "mouseover": "on_mouse_over",
        "mouseout": "unfocus"
      };

      UserAutocompleteItem.prototype.on_click = function(event) {
        this.trigger("select", this.model);
        return false;
      };

      UserAutocompleteItem.prototype.on_mouse_over = function() {
        return this.trigger("focus", this.model);
      };

      UserAutocompleteItem.prototype.focus = function() {
        return this.$el.focus();
      };

      UserAutocompleteItem.prototype.unfocus = function() {};

      UserAutocompleteItem.prototype.highlight = function(terms) {
        this.terms = terms;
        return this.render();
      };

      UserAutocompleteItem.prototype.highlighted_name = function() {
        var name, names,
          _this = this;
        name = this.model.attributes.name;
        if (!this.terms) return name;
        names = name.split(/\s+/);
        names = _(names).map(function(name) {
          var context, longest_match, lower_name, matched_terms;
          lower_name = name.toLowerCase();
          matched_terms = _(_this.terms).filter(function(term) {
            return lower_name.indexOf(term.toLowerCase()) === 0;
          });
          if (matched_terms.length > 0) {
            longest_match = _(matched_terms).max(function(term) {
              return term.length;
            });
            context = {
              highlighted: name.substr(0, longest_match.length),
              rest: name.substr(longest_match.length)
            };
            return Mustache.render(templates.highlighted_name, context);
          } else {
            return name;
          }
        });
        return names.join(" ");
      };

      return UserAutocompleteItem;

    })(extensions.MustacheView);
    exports.UserAutocomplete = (function(_super) {

      __extends(UserAutocomplete, _super);

      function UserAutocomplete() {
        UserAutocomplete.__super__.constructor.apply(this, arguments);
      }

      UserAutocomplete.prototype.item_view = exports.UserAutocompleteItem;

      UserAutocomplete.prototype.tagName = "ul";

      UserAutocomplete.prototype.attributes = {
        "class": "autocomplete"
      };

      UserAutocomplete.prototype.events = {
        "keydown": "on_key_down",
        "keypress": "on_key_press"
      };

      UserAutocomplete.prototype.WINDOW_MARGIN = 10;

      UserAutocomplete.prototype.initialize = function() {
        var focus_model, select,
          _this = this;
        UserAutocomplete.__super__.initialize.apply(this, arguments);
        this.user_pool = this.options["user_pool"];
        select = _.bind(this.select, this);
        focus_model = _.bind(this.focus_model, this);
        this.on("refresh", function(items) {
          _(items).invoke("on", "select", select);
          _(items).invoke("on", "focus", focus_model);
          if (_this.terms) return _(items).invoke("highlight", _this.terms);
        });
        return $(window).resize(function() {
          return _this.set_max_height();
        });
      };

      UserAutocomplete.prototype.focused = false;

      UserAutocomplete.prototype.focused_item = null;

      UserAutocomplete.prototype.focus_model = function(model) {
        var n;
        if (!this.collection.include(model)) throw "Model not in collection.";
        n = this.collection.indexOf(model);
        if (n !== -1) return this.focus_item(n);
      };

      UserAutocomplete.prototype.focus_input = function() {
        this.trigger("focus_input");
        return this.unfocus();
      };

      UserAutocomplete.prototype.on_key_down = function(event) {
        var input_keys, _ref;
        input_keys = [utils.keyCodes.KEY_BACKSPACE];
        if (_ref = event.keyCode, __indexOf.call(input_keys, _ref) >= 0) {
          this.focus_input();
        }
        if ($.browser.webkit) return this.on_key_press(event);
      };

      UserAutocomplete.prototype.on_key_press = function(event) {
        var _ref;
        if (event.keyCode === utils.keyCodes.KEY_UP) {
          if (typeof event.preventDefault === "function") event.preventDefault();
          return this.prev();
        } else if (event.keyCode === utils.keyCodes.KEY_DOWN) {
          return this.next();
        } else if ((_ref = event.keyCode) === utils.keyCodes.KEY_ENTER || _ref === utils.keyCodes.KEY_SPACE) {
          return this.items[this.focused_item].$el.click();
        }
      };

      UserAutocomplete.prototype.unfocus = function() {
        this.focused_item = null;
        return this.focused = false;
      };

      UserAutocomplete.prototype.prev = function() {
        if (this.focused_item === 0) {
          return this.focus_input();
        } else {
          return this.focus_item(this.focused_item - 1);
        }
      };

      UserAutocomplete.prototype.next = function() {
        if (this.focused_item === this.items.length - 1) {
          return this.focus_item(0);
        } else {
          return this.focus_item(this.focused_item + 1);
        }
      };

      UserAutocomplete.prototype.select = function(model) {
        this.unfocus();
        this.trigger("select", model);
        return this.trigger("focus_input");
      };

      UserAutocomplete.prototype.focus = function() {
        return this.focus_item(0);
      };

      UserAutocomplete.prototype.focus_item = function(n) {
        if (n >= this.items.length) {
          throw ("Attempting to focus item " + n + " but autocomplete only ") + ("has " + this.items.length + " items.");
        }
        if (n < 0) throw "Attempting to focus item " + n + ".";
        if (this.focused_item !== n) {
          if (this.focused_item) this.items[this.focused_item].unfocus();
          this.items[n].focus();
          return this.focused_item = n;
        }
      };

      UserAutocomplete.prototype.float = function() {
        var left, top, _ref;
        if (!this.floated) {
          _ref = this.$el.offset(), top = _ref.top, left = _ref.left;
          this.$el.css("position", "absolute");
          this.$el.css("top", top);
          this.$el.css("left", left);
          return this.floated = true;
        }
      };

      UserAutocomplete.prototype.filter = function(terms) {
        var query,
          _this = this;
        this.terms = terms;
        if (terms && terms.length > 0 && _.any(terms)) {
          query = function(user) {
            return _(terms).all(function(term) {
              var names;
              names = user.get("name").split(/\s+/);
              return _(names).any(function(name) {
                return name.toLowerCase().indexOf(term) === 0;
              });
            });
          };
          this.collection.remove(this.collection.models);
          this.collection.add(this.user_pool.filter(query));
          return this.show();
        } else {
          this.collection.remove(this.collection.models);
          return this.hide();
        }
      };

      UserAutocomplete.prototype.hide = function() {
        return this.$el.hide();
      };

      UserAutocomplete.prototype.show = function() {
        if (this.collection.models.length === 0) return;
        return this.$el.show();
      };

      UserAutocomplete.prototype.set_max_height = function() {
        var top;
        top = this.$el.offset().top;
        if (top) {
          return this.$el.css("maxHeight", ($(window).height() - top) - this.WINDOW_MARGIN);
        }
      };

      UserAutocomplete.prototype.render = function() {
        UserAutocomplete.__super__.render.apply(this, arguments);
        this.set_max_height();
        this.float();
        if (this.collection.models.length === 0) return this.hide();
      };

      return UserAutocomplete;

    })(extensions.CollectionView);
    exports.SelectedUsersItem = (function(_super) {

      __extends(SelectedUsersItem, _super);

      function SelectedUsersItem() {
        SelectedUsersItem.__super__.constructor.apply(this, arguments);
      }

      SelectedUsersItem.prototype.template = templates.selected_users_item;

      SelectedUsersItem.prototype.attributes = {
        "class": "selected_user"
      };

      SelectedUsersItem.prototype.events = {
        "click .remove_button": "remove"
      };

      SelectedUsersItem.prototype.remove = function() {
        return this.trigger("remove_item", this.model);
      };

      SelectedUsersItem.prototype.focus_remove = function() {
        return this.$('.remove_button').get(0).focus();
      };

      return SelectedUsersItem;

    })(extensions.MustacheView);
    exports.SelectedUsers = (function(_super) {

      __extends(SelectedUsers, _super);

      function SelectedUsers() {
        SelectedUsers.__super__.constructor.apply(this, arguments);
      }

      SelectedUsers.prototype.item_view = exports.SelectedUsersItem;

      SelectedUsers.prototype.attributes = {
        "class": "clearfix"
      };

      SelectedUsers.prototype.initialize = function() {
        var remove;
        SelectedUsers.__super__.initialize.apply(this, arguments);
        remove = _.bind(this.remove_item, this);
        return this.on("refresh", function(items) {
          return _(items).invoke("on", "remove_item", remove);
        });
      };

      SelectedUsers.prototype.remove_item = function(model) {
        var next_index;
        next_index = this.collection.indexOf(model) - 1;
        this.collection.remove(model);
        if ((0 <= next_index && next_index < this.collection.models.length)) {
          return this.items[next_index].focus_remove();
        } else {
          return this.trigger("focus_search");
        }
      };

      return SelectedUsers;

    })(extensions.CollectionView);
    exports.SelectedHiddenInput = (function(_super) {

      __extends(SelectedHiddenInput, _super);

      function SelectedHiddenInput() {
        SelectedHiddenInput.__super__.constructor.apply(this, arguments);
      }

      SelectedHiddenInput.prototype.template = templates.selected_hidden_input;

      return SelectedHiddenInput;

    })(extensions.MustacheView);
    exports.SelectedHiddenInputArray = (function(_super) {

      __extends(SelectedHiddenInputArray, _super);

      function SelectedHiddenInputArray() {
        SelectedHiddenInputArray.__super__.constructor.apply(this, arguments);
      }

      SelectedHiddenInputArray.prototype.item_view = exports.SelectedHiddenInput;

      SelectedHiddenInputArray.prototype.attributes = {
        style: "display:none"
      };

      return SelectedHiddenInputArray;

    })(extensions.CollectionView);
    return exports;
  });

}).call(this);
