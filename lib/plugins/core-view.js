'use strict';

var _ = require('underscore');

var utils = require('../utils');

module.exports = function (formatic) {

  var views = {};

  formatic.hook('view', function (name, view) {

    views[name] = view;
  });

  formatic.form.use('init', function (next) {

    this.attached = [];

    next();
  });

  formatic.form.hook('attach', function (node, done) {

    var field = this.run(this.root, this.data);
    var component = this.component(field);
    var attachedComponent = formatic.attachComponent(component, node, done);

    var info = _.find(this.attached, function (info) {
      return info.node === node;
    });

    if (info) {
      info.component = attachedComponent;
    } else {
      this.attached.push({
        component: attachedComponent,
        node: node
      });
    }

    return attachedComponent;
  });

  formatic.form.hook('detach', function (node) {

    if (node) {
      var infoIndex = -1;
      _.find(this.attached, function (info, i) {
        if (info.node === node) {
          formatic.detachComponent(node);
          infoIndex = i;
          return;
        }
      });
      if (infoIndex >= 0) {
        this.attached.splice(infoIndex, 1);
      }
    } else {
      _.each(this.attached, function (info) {
        formatic.detachComponent(info.node);
      });
      this.attached = [];
    }
  });

  formatic.form.hook('component', function (field) {

    field = field || this.root;

    var view = views[field.type];

    if (!view) {
      throw new Error('No view for type: ' + field.type);
    }

    var props = {
      form: this,
      field: field
    };

    if (field.key) {
      var onChange = function () {
        throw new Error('No onChange hook defined.');
      };

      if (formatic.hasHook('onChangeComponent')) {
        onChange = formatic.onChangeComponent.bind(null, this.onChange.bind(this, field));
      }

      props.onChange = onChange;
    }

    return view(props);
  });

  formatic.form.hook('updateView', function (props) {
    _.each(this.attached, function (info) {
      formatic.updateComponent(info.component, props);
    }.bind(this));
  });
};