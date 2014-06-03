define([
  'app',
  'backbone',
  'core/PreferenceModel'
],
function(app, Backbone, PreferenceModel) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('\
    <div class="left snapshotOption" id="saveSnapshotBtn"><span class="icon icon-camera"></span></div> \
    {{#if hasActiveColumn}} \
    <div class="simple-select dark-grey-color simple-gray left"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="visibilitySelect" name="status" class="change-visibility"> \
        <optgroup label="Status"> \
          <option data-status value="1,2">View All</option> \
          <option data-status value="1">View Active</option> \
          <option data-status value="2">View Inactive</option> \
        </optgroup> \
      </select> \
      <select id="template" style="display:none;width:auto;"><option id="templateOption"></option></select> \
    </div> \
    {{/if}}'),

    tagName: 'div',
    attributes: {
      'class': 'tool'
    },

    events: {
      'change #visibilitySelect': function(e) {
        var $target = $(e.target).find(":selected");
        if($target.attr('data-status') !== undefined && $target.attr('data-status') !== false) {
          var value = $(e.target).val();
          this.collection.setFilter({currentPage: 0, active: value});
        }
      },
      'click #saveSnapshotBtn': 'saveSnapshot',
    },

    saveSnapshot: function() {
      var name = prompt("Please enter a name for your Snapshot");
      if(name === null) {
        return;
      }

      var that = this;
      var exists = false;
      //Check for Duplicate
      this.options.widgetOptions.snapshots.forEach(function(snapshot) {
        if(name == snapshot) {
          alert('A Snapshot With that name already exists!');
          exists = true;
          return;
        }
      });

      if(exists) {
        return;
      }

      if(name === null || name === "") {
        alert('Please Fill In a Valid Name');
        return;
      }

      //Save id so it can be reset after render
      this.defaultId = this.collection.preferences.get('id');
      //Unset Id so that it creates new Preference
      this.collection.preferences.unset('id');
      this.collection.preferences.set({title: name});
      this.collection.preferences.save();
      this.pinSnapshot(name);
    },

    pinSnapshot: function(title) {
      var data = {
        title: title,
        url: Backbone.history.fragment + "/pref/" + title,
        icon_class: 'icon-search',
        user: app.users.getCurrentUser().get("id"),
        section: 'search'
      };
      if(!app.getBookmarks().isBookmarked(data.title)) {
        app.getBookmarks().addNewBookmark(data);
      }
    },

    deleteSnapshot: function() {
      if(this.snapshotData.id) {
        var user = app.users.getCurrentUser().get("id");
        var that = this;
        this.collection.preferences.destroy({contentType: 'application/json', data: JSON.stringify({id:this.snapshotData.id, user: user}),success: function() {
          $('#visibilitySelect').val(that.collection.preferences.get('active'));
          that.options.widgetOptions.snapshots.splice(that.snapshotData.title, 1);
          app.getBookmarks().removeBookmark({title: that.snapshotData.title, icon_class: 'icon-search', user: user});
          that.snapshotData = null;
        }});
      }
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    afterRender: function() {
      if(this.options.widgetOptions.hasActiveColumn) {
        $('#visibilitySelect').val(this.collection.preferences.get('active'));
      }

      // Adjust dropdown width dynamically
      // var sel = this.$el.find('#visibilitySelect');
      // this.$el.find('#templateOption').text( sel.find(":selected").text() );
      // sel.width( this.$el.find('#template').width() * 1.03 + 10 ); // +10 is for arrow on right
    },
    initialize: function() {
      var activeTable = this.collection.table.id;

      this.options.widgetOptions = {snapshots: []};

      if(this.collection.table.columns.get('active')) {
        this.options.widgetOptions.hasActiveColumn = true;
      }

      if(app.router.loadedPreference) {
        this.defaultId = this.collection.preferences.get('id');
        this.collection.preferences.fetch({newTitle: app.router.loadedPreference});
      }

      this.listenTo(this.collection.preferences, 'sync', function() {
        this.collection.fetch();
        if(this.defaultId) {
          this.collection.preferences.set({title:null, id: this.defaultId});
        }
      });
    }
  });
});