module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'builder:open': function () {
        Editor.Panel.open('builder.panel');
    },

    'builder:build-runtime-project': function ( settings ) {
        Editor.log( 'on build runtime project', settings );
    },
};
