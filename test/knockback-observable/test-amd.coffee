$(->
  module("knockback-observable-amd.js")

  # library and dependencies
  require(['underscore', 'backbone', 'knockout', 'knockback', 'knockback-statistics'], (_, Backbone, ko, kb, kbs) ->
    _ or= @_
    Backbone or= @Backbone
    test("TEST DEPENDENCY MISSING", ->
      ok(!!ko, 'ko')
      ok(!!_, '_')
      ok(!!Backbone, 'Backbone')
      ok(!!kb, 'kb')
      ok(!!kbs, 'kbs')
    )

    test("6. Inferring observable types: the hard way", ->
      kb.statistics = new kb.Statistics() # turn on stats

      class ChildrenCollection extends kb.CollectionObservable
        constructor: (collection, options) ->
          return super(collection, {view_model: InferringViewModel, options: options}) # return the observable instead of this

      InferringViewModel = (model, options) ->
        @_auto = kb.viewModel(model, {keys: ['name', 'parent', 'children'], options: options}, @)
        @maybe_null_name = kb.observable(model, 'maybe_null_name')
        @maybe_null_parent = kb.observable(model, {key: 'maybe_null_parent', factories: InferringViewModel, options: @_auto.shareOptions()}) # use shareOptions to share view models (avoid infinite loops trying to resolve relationships)
        @maybe_null_children = kb.observable(model, {key: 'maybe_null_children', factories: ChildrenCollection, options: @_auto.shareOptions()}) # use shareOptions to share view models (avoid infinite loops trying to resolve relationships)
        return

      parent = new kb.Model({name: 'Daddy'})
      children_child = new kb.Model({name: 'Baby'})
      children = new kb.Collection([{name: 'Bob', children: new kb.Collection([children_child]), maybe_null_children: new kb.Collection([children_child])}])
      model = new kb.Model({})

      view_model = new InferringViewModel(model)
      equal(view_model.name(), null, 'inferred name as simple null')
      equal(view_model.parent(), null, 'inferred parent as simple null')
      equal(view_model.children(), null, 'inferred children as simple null')
      equal(view_model.maybe_null_name(), null, 'name is null')
      equal(view_model.maybe_null_parent().name(), null, 'parent name is null')
      ok(view_model.maybe_null_parent() instanceof InferringViewModel, 'maybe_null_parent type is inferring')
      equal(view_model.maybe_null_children().length, 0, 'no children yet')

      # update the model
      model.set({
        name: 'Fred'
        parent: parent
        children: children
      })
      equal(view_model.name(), 'Fred', 'name is Fred')
      equal(view_model.parent().name(), 'Daddy', 'parent name is Daddy')
      ok(view_model.parent() instanceof kb.ViewModel, 'parent type is kb.ViewModel')
      equal(view_model.children()[0].name(), 'Bob', 'child name is Bob')
      ok(view_model.children()[0] instanceof kb.ViewModel, 'child type is kb.ViewModel')
      equal(view_model.children()[0].children()[0].name(), 'Baby', 'child child name is Baby')
      ok(view_model.children()[0].children()[0] instanceof kb.ViewModel, 'child child type is kb.ViewModel')
      equal(view_model.maybe_null_name(), null, 'name is null')
      equal(view_model.maybe_null_parent().name(), null, 'parent name is null')
      equal(view_model.maybe_null_children().length, 0, 'no children yet')

      # update the model
      model.set({
        maybe_null_name: model.get('name')
        maybe_null_parent: model.get('parent')
        maybe_null_children: model.get('children')
      })
      equal(view_model.maybe_null_name(), 'Fred', 'maybe_null_name is Fred')
      equal(view_model.maybe_null_parent().name(), 'Daddy', 'maybe_null_parent name is Daddy')
      ok(view_model.maybe_null_parent() instanceof InferringViewModel, 'maybe_null_parent type is InferringViewModel')
      equal(view_model.maybe_null_children()[0].name(), 'Bob', 'child name is Bob')
      ok(view_model.maybe_null_children()[0] instanceof InferringViewModel, 'child type is InferringViewModel')
      equal(view_model.maybe_null_children()[0].children()[0].name(), 'Baby', 'child child name is Baby')
      ok(view_model.maybe_null_children()[0].children()[0] instanceof kb.ViewModel, 'child child type is kb.ViewModel')
      equal(view_model.maybe_null_children()[0].maybe_null_children()[0].name(), 'Baby', 'maybe_null_children maybe_null_children name is Baby')
      ok(view_model.maybe_null_children()[0].maybe_null_children()[0] instanceof InferringViewModel, 'maybe_null_children maybe_null_children type is InferringViewModel')

      # and cleanup after yourself when you are done.
      kb.release(view_model)

      equal(kb.statistics.registeredStatsString('all released'), 'all released', "Cleanup: stats"); kb.statistics = null
    )
  )
)