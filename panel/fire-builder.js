var Remote = require('remote');
var Url = require('fire-url');
var Fs = require('fire-fs');
var Path = require('fire-path');
var Shell = require('shell');

Editor.registerPanel( 'fire-builder.panel', {
    is: 'fire-builder',

    properties: {
        platform: {
            type: String,
            value: 'web-mobile'
        },
        buildPath: {
            type: String,
            value: '',
        },
        projectInfo: {
            type: Object,
            value: function () {
                return [];
            }
        },
        isDebug: {
            type: Boolean,
            value: true,
        }
    },

    ready: function () {
        this.projectInfo = Editor.projectInfo;
        this.buildPath = this.projectInfo.path;
    },

    _chooseDistPath: function (event) {
        event.stopPropagation();

        var dialog = Remote.require('dialog');
        var projectPath = Editor.projectInfo.path;

        dialog.showOpenDialog({ defaultPath: projectPath, properties: ['openDirectory']},function (res) {
            if (res) {
                if (this.platform === 'web-mobile') {
                    this.buildPath = res + '/mobile-' + Path.basename(projectPath);
                }
                else {
                    this.buildPath = res + '/desktop-' + Path.basename(projectPath);
                }
            }
        }.bind(this));
    },

    _showInFinder: function (event) {
        event.stopPropagation();

        if (!Fs.existsSync(this.buildPath)) {
            Editor.warn('%s not exists!', this.buildPath);
            return;
        }
        Shell.showItemInFolder(Path.normalize(this.buildPath));
        Shell.beep();

    },

    _previewAction: function (event) {
        event.stopPropagation();

        Shell.openExternal('http://localhost:7456');
        Shell.beep();
    },

    _closeWindow: function (event) {
        event.stopPropagation();

        window.close();
    },

    _buildButtonHoverInAction: function (event) {
        event.stopPropagation();

        this.$.build_text.hidden = true;
        this.$.build_icon.hidden = false;
    },

    _buildButtonHoverOutAction: function (event) {
        event.stopPropagation();

        this.$.build_text.hidden = false;
        this.$.build_icon.hidden = true;
    },
});
