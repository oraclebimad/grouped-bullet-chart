{
  id: '03efcb62a28c.GroupedBulletChart',
  component: {
    'name': 'Grouped Bullet Chart',
    'tooltip': 'Insert Grouped Bullet Chart',
    'cssClass': 'grouped-bullet-chart-plugin'
  },
  properties: [
    {key: "width", label: "Width", type: "length", value: "1024px"},
    {key: "height", label: "Height", type: "length", value: "300px"},
    {key: "labelfont", label: "Label Font Size", type: "fontsize", value: "14px"},
    {key: "showlabel", label: "Show Label", type: "boolean", value: true},
    {key: "showlegends", label: "Show Legends", type: "boolean", value: false},
    {key: "opacity", label: "Threshold opacity", type: "number", value: ".75"},
    {key: "lowest", label: "Lower Level %", type: "number", value: "33"},
    {key: "middle", label: "Middle Level %", type: "number", value: "66"},
    {key: "higher", label: "Higher Level %", type: "number", value: "140"},
    {key: "lowestcolor", label: "Lower Color", type: "color", value: "#EC5D57"},
    {key: "middlecolor", label: "Middle Color", type: "color", value: "#F5D328"},
    {key: "highercolor", label: "Higher Color", type: "color", value: "#70BF41"},
    {key: "currentcolor", label: "Current Bar Color", type: "color", value: "#53585F"},
    {key: "targetcolor", label: "Target Color", type: "color", value: "#53585F"}
  ],
  remoteFiles: [
    {
      type:'js',
      location: 'asset://js/GroupedBulletChart.concat.js',
      isLoaded: function() {
        return 'Visualizations' in window && 'BulletChart' in Visualizations;
      }
    },
    {
      type:'css',
      location:'asset://css/style.css'
    }
  ],
  fields: [
    {name: "group", caption: "Drop Group", fieldType: "label", dataType: "string"},
    {name: "current", caption: "Drop Current Value", fieldType: "measure", dataType: "number", formula: "summation"},
    {name: "baseline", caption: "Drop Baseline", fieldType: "measure", dataType: "number", formula: "summation"}
  ],
  avoidRefresh: false,
  dataType: 'arrayOfArrays',
  render: function (context, container, data, fields, props) {
    var self = this;
    var nested;
    var indexedFields;
    container.innerHTML = '';

    this.dataModel = new Utils.DataModel(data, fields);
    this.dataModel.sortBy('baseline').desc().indexColumns();
    indexedFields = this.dataModel.indexedMetaData;
    nested = this.dataModel.nest();
    //override key to place correct label
    nested.key = Utils.capitalize(this.dataModel.indexedMetaData.current.label);

    props.numberprefix = typeof props.numberprefix !== 'boolean' ? props.numberprefix === 'true' : props.numberprefix;
    var baseLineFormat = this.formatter(indexedFields.baseline);
    var currentFormat = this.formatter(indexedFields.current);
    this.visualization = new Visualizations.BulletChart(container, nested, {
      width: parseInt(props.width, 10),
      height: parseInt(props.height, 10),
      numberFormat: currentFormat,
      baseLineFormat: baseLineFormat,
      currentFormat: currentFormat,
      showLabel: typeof props.showlabel === 'boolean' ? props.showlabel : props.showlabel === 'true',
      renderLegends: typeof props.showlegends === 'boolean' ? props.showlegends : props.showlegends === 'true',
      labelPosition: 'top',
      axisOnChart: true,
      axisFormat: currentFormat,
      thresholds: {
        lowest: +props.lowest,
        middle: +props.middle,
        higher: +props.higher
      },
      colors: {
        lowest: props.lowestcolor,
        middle: props.middlecolor,
        higher: props.highercolor,
        current: props.currentcolor,
        target: props.targetcolor
      },
      axisPosition: 'bottom',
      labelFontSize: parseInt(props.labelfont, 10),
      opacity: props.opacity,
      currentLabel: this.dataModel.indexedMetaData.current.label,
      targetLabel: this.dataModel.indexedMetaData.baseline.label
    });
    this.visualization.render();
    this.visualization.addEventListener('filter', function (filters) {
      filters = self.constructFilters(filters, context);
      xdo.api.handleClickEvent(filters);
      this.updateFilterInfo(filters.filter);
      console.log(filters);
    }).addEventListener('remove-filter', function (filters) {
      self.avoidRefresh = true;
      filters.forEach(function (filter) {
        try{
             xdo.app.viewer.GlobalFilter.removeFilter(context.id, filter.id);
        } catch (e) {}
      });
    });
  },
  refresh: function (context, container, data, fields, props) {
    if (!this.avoidRefresh) {
      this.dataModel.setData(data).indexColumns();
      var nested = this.dataModel.nest();
      //override key to place correct label
      nested.key = Utils.capitalize(this.dataModel.indexedMetaData.current.label);
      this.visualization.animate(true);
      this.visualization.setData(nested).render();
    }
    this.avoidRefresh = false;
  },
  formatter: function (fieldMetaData, opts) {
    if (xdo.api.format && fieldMetaData.dataType === 'number')
      return xdo.api.format(fieldMetaData.dataType, fieldMetaData.formatMask, fieldMetaData.formatStyle);

    return Utils.format('thousands', opts);
  },
  constructFilters: function (data, context) {
    var group = this.dataModel.indexedMetaData.group.field;
    var filters = [];
    var children;
    for (var key in data) {
      filters.push({field: group, value: data[key].name});
    }

    return {
      id: context.id,
      filter: filters
    };
  }
}
