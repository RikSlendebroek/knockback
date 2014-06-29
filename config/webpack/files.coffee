module.exports =
  core: [
    './src/core/utils.coffee'
    './src/core/event-watcher.coffee'
    './src/core/store.coffee'
    './src/core/factory.coffee'
    './src/core/observable.coffee'
    './src/core/view-model.coffee'
    './src/core/utils.coffee'
    './src/core/collection-observable.coffee'
    './src/core/orm.coffee'
    './src/core/inject.coffee'
    './src/core/statistics.coffee'
  ]

  plugins: [
    './src/defaults/default-observable.coffee'
    './src/formatting/formatted-observable.coffee'
    './src/localization/localized-observable.coffee'
    './src/triggering/triggered-observable.coffee'
    './src/validation/validation.coffee'
  ]
