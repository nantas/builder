var Remote = require('remote');
var Url = require('fire-url');
var Fs = require('fire-fs');
var Path = require('fire-path');
var Shell = require('shell');

Editor.registerPanel( 'builder.panel', {
    is: 'editor-builder',

    properties: {
        platformList: {
            type: Array,
            value: function () {
                return [
                    { value: 'web-mobile', text: 'Web Mobile' },
                    { value: 'web-desktop', text: 'Web Desktop' },
                ];
            },
        },

        sceneList: {
            type: Array,
            value: function () {
                return [];
            },
        },

        buildProgress: {
            type: Number,
            value: 0,
        },

        buildState: {
            type: String,
            value: 'sleep',
        },
    },

    observers: [
        '_projectProfileChanged(profiles.project.*)'
    ],

    ready: function () {
        this.async( function () {
            var self = this;

            if ( !self.profiles.project.title ) {
                self.set('profiles.project.title', Editor.projectInfo.name );
            }
            if ( !self.profiles.project.buildPath ) {
                self.set('profiles.project.buildPath',
                         Path.join( Editor.projectInfo.path, 'build', self.profiles.project.title ) );
            }
            Editor.assetdb.queryAssets( 'assets://**/*', 'scene', function ( results ) {
                // clean up excludeScenes
                var needSave = false;
                self.profiles.project.excludeScenes.forEach(function ( excludeScene, index ) {
                    var found = results.some( function ( result ) {
                        return result.uuid === excludeScene;
                    });

                    if ( !found ) {
                        self.profiles.project.excludeScenes.splice( index, 1 );
                        needSave = true;
                    }
                });
                if ( needSave ) {
                    self.profiles.project.save();
                }

                self.sceneList = results.map( function ( result ) {
                    return {
                        value: result.uuid,
                        text: result.url,
                        checked: self.profiles.project.excludeScenes.indexOf(result.uuid) === -1
                    };
                });

                if ( !self.profiles.project.startSceneUuid && self.sceneList.length > 0 ) {
                    self.set('profiles.project.startSceneUuid', self.sceneList[0].value );
                }
            });
        });
    },

    _onChooseDistPathClick: function (event) {
        event.stopPropagation();

        var dialog = Remote.require('dialog');
        var projectPath = Editor.projectInfo.path;

        dialog.showOpenDialog({
            defaultPath: projectPath,
            properties: ['openDirectory']
        }, function (res) {
            if (res) {
                this.set('profiles.project.buildPath', res[0]);
            }
        }.bind(this));
    },

    _onShowInFinderClick: function (event) {
        event.stopPropagation();

        if (!Fs.existsSync(this.profiles.project.buildPath)) {
            Editor.warn('%s not exists!', this.profiles.project.buildPath);
            return;
        }
        Shell.showItemInFolder(this.profiles.project.buildPath);
        Shell.beep();

    },

    _onPreviewClick: function (event) {
        event.stopPropagation();

        Shell.openExternal('http://localhost:7456');
        Shell.beep();
    },

    _onBuildClick: function (event) {
        event.stopPropagation();

        this.cancelAsync(this._sleepID);
        this.$.progress.reset();

        var buildUuidList = this.sceneList.filter( function ( scene ) {
            return scene.checked;
        }).map( function ( scene ) {
            return scene.value;
        });

        if (buildUuidList.length > 0) {
            Editor.sendToCore('app:build-project', {
                title: this.profiles.project.title,
                platform: this.profiles.project.platform,
                buildPath: this.profiles.project.buildPath,
                startScene: this.profiles.project.startScene,
                scenes: buildUuidList,
                debug: this.profiles.project.debug,
            });
        }
        else {
            Editor.error('Please select scenes to build');
        }
    },

    _isStartScene: function ( startScene, value ) {
        return startScene === value;
    },

    _onCheckedChanged: function () {
        var model = this.$.sceneList.modelForElement(event.target);
        var idx = this.profiles.project.excludeScenes.indexOf( model.item.value );

        if ( model.item.checked ) {
            if ( idx !== -1 ) {
                this.splice( 'profiles.project.excludeScenes', idx, 1 );
            }
        }
        else {
            if ( idx === -1 ) {
                this.push( 'profiles.project.excludeScenes', model.item.value );
            }
        }
    },

    _projectProfileChanged: function ( changeRecord ) {
        if ( this.profiles.project.save ) {
            this.profiles.project.save();
        }
    },

    _isBuilding: function ( state ) {
        return state !== 'sleep';
    },

    _buildStateText: function ( state ) {
        return EditorUI.toHumanText(state);
    },

    'builder:state-changed': function ( state, progress, err ) {
        this.buildState = state;
        this.buildProgress = progress;

        if ( state === 'error' ) {
            this.buildState = 'failed';
            this.$.progress.failed = true;
            return;
        }

        if ( state === 'finish' ) {
            this._sleepID = this.async(function () {
                this.buildState = 'sleep';
                this._sleepID = -1;
            },1000);
        }
    },
});
