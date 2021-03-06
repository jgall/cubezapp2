(function() {
  
  var FIELD_WIDTH = 170;
  var FIELD_HEIGHT = 30;
  var CONTENT_HEIGHT = 200;
  
  function AddPopup() {
    // Generate the puzzle.
    var puzzle = $('<div class="puzzle"></div>');
    puzzle.append();
    puzzle.append();
    this._puzzleIcon = $('<div class="icon flavor-background"></div>');
    this._puzzleName = $('<label>Name</label>');
    puzzle.append([this._puzzleIcon, this._puzzleName]);
    
    // Create the fields container.
    this._fields = $('<div class="fields"></div>');
    
    // This state is used to know whether or not to play an animation to show
    // the subscramble dropdown.
    this._showingSubscramble = false;
    
    // These keep track of which field the user has explicitly set.
    this._userChangedIcon = false;
    this._userChangedScramble = false;
    
    // Create the rest of the hidden class.
    this._dialog = null;
    this._bldField = null;
    this._bldCheck = null;
    this._iconField = null;
    this._iconDropdown = null;
    this._nameField = null;
    this._nameInput = null;
    this._scrambleField = null;
    this._scrambleDropdown = null;
    this._subscrambleField = null;
    this._subscrambleDropdown = null;
    
    // Generate the input fields.
    this._createBLDField();
    this._createIconField();
    this._createNameField();
    this._createScrambleField();
    this._createSubscrambleField();
    
    // Layout the fields.
    this._initialLayout();
    
    // Create the actual popup.
    var element = $('<div class="add-popup-content"></div>');
    var separator = $('<div class="separator"></div>');
    element.append([puzzle, separator, this._fields]);
    this._dialog = new window.app.Dialog('New Puzzle', element, ['Create']);
    this._dialog.onAction = this._done.bind(this);
    this._dialog.onClose = this._handleClose.bind(this);
  }
  
  AddPopup.prototype.show = function() {
    this._dialog.show();
  };
  
  AddPopup.prototype._changedIcon = function() {
    this._userChangedIcon = true;
    
    // Get the filename from the human-readable name.
    var name = window.app.iconFiles[this._iconDropdown.selected()];
    this._puzzleIcon.css({
      backgroundImage: 'url(images/puzzles/' + name + '.png)'
    });
    
    // If we can change the scramble, try it. There's no harm in it.
    if (!this._userChangedScramble) {
      var iconName = this._iconDropdown.value();
      var lastIdx = this._scrambleDropdown.selected();
      this._scrambleDropdown.setSelectedValue(iconName);
      if (this._scrambleDropdown.selected() !== lastIdx) {
        this._changedScramble();
        this._userChangedScramble = false;
      }
    }
  };
  
  AddPopup.prototype._changedName = function() {
    this._puzzleName.text(this._nameInput.val() || 'Name');
    if (!this._userChangedIcon) {
      this._iconDropdown.setSelectedValue(this._nameInput.val());
      if (this._iconDropdown.value() === this._nameInput.val()) {
        this._changedIcon();
        this._userChangedIcon = false;
      }
    }
  };
  
  AddPopup.prototype._changedScramble = function() {
    this._userChangedScramble = true;
    
    var subScramblers = this._subscramblers();
    var showSub = (subScramblers.length > 1);
    
    // Update the subscramblers in the dropdown if possible.
    if (showSub) {
      this._subscrambleDropdown.setOptions(subScramblers, 0);
    }
    
    // If the subscramble visibility did not change, no animation or relayout is
    // needed.
    if (showSub === this._showingSubscramble) {
      return;
    }
    
    this._showingSubscramble = showSub;
    
    // Animate all elements to their new positions.
    var positions = this._fieldPositions();
    var fields = [this._nameField, this._iconField, this._scrambleField,
      this._bldField];
    for (var i = 0; i < 4; ++i) {
      var y = positions[i];
      fields[i].animate({top: y});
    }
    
    // Fade in/out the subscramble field.
    if (showSub) {
      this._subscrambleField.fadeIn();
    } else {
      this._subscrambleField.fadeOut();
    }
  };
  
  AddPopup.prototype._changedSubscramble = function() {
    this._userChangedScramble = true;
  };
  
  AddPopup.prototype._createBLDField = function() {
    this._bldField = $('\
      <div class="field"> \
        <label>BLD</label> \
        <div class="content"></div> \
      </div> \
    ');
    var content = this._bldField.find('.content');
    this._bldCheck = window.app.flavors.makeCheckbox();
    content.append(this._bldCheck.element());
  };
  
  AddPopup.prototype._createIconField = function() {
    // Generate the dropdown field.
    var res = createDropdownField('Icon', window.app.iconNames,
      window.app.iconNames.indexOf('3x3x3'));
    this._iconDropdown = res.dropdown;
    this._iconField = res.field;
    
    // Changing the icon field changes the icon in the preview.
    this._iconDropdown.onChange = this._changedIcon.bind(this);
  };
  
  AddPopup.prototype._createNameField = function() {
    this._nameField = $('\
      <div class="field"> \
        <label>Name</label> \
        <div class="content"> \
          <input placeholder="Name" maxlength="19"> \
        </div> \
      </div> \
    ');
    this._nameInput = this._nameField.find('input');
    
    // When the text changes, change the puzzle name on the left.
    this._nameInput.keydown(function() {
      // The text isn't changed by the keydown, so we wait 10ms.
      setTimeout(function() {
        this._changedName();
      }.bind(this), 10);
    }.bind(this));
    this._nameInput.change(this._changedName.bind(this));
  };
  
  AddPopup.prototype._createScrambleField = function() {
    // Generate the puzzles.
    var puzzles = window.puzzlejs.scrambler.allPuzzles();
    puzzles.unshift('None');
    
    // Generate the dropdown field.
    var res = createDropdownField('Scramble', puzzles, 0);
    this._scrambleDropdown = res.dropdown;
    this._scrambleField = res.field;
    
    // When the scramble changes, it changes the subscrambles.
    this._scrambleDropdown.onChange = this._changedScramble.bind(this);
  };
  
  AddPopup.prototype._createSubscrambleField = function() {
    var res = createDropdownField(null, null, 0);
    this._subscrambleDropdown = res.dropdown;
    this._subscrambleField = res.field;
    
    // By default, this field is invisible.
    this._subscrambleField.css({display: 'none'});
    this._subscrambleDropdown.onChange = this._changedSubscramble.bind(this);
  };
  
  // _done process the user's input and creates a puzzle.
  AddPopup.prototype._done = function() {
    var name = this._nameInput.val();
    if (name === '') {
      this._nameInput.focus();
      this._shakeName();
      return;
    }
    
    // Fiend the info they selected.
    var icon = window.app.iconFiles[this._iconDropdown.selected()];
    var scrambler = this._scrambleDropdown.value();
    var subscramblers = this._subscramblers();
    var subscrambler = '';
    if (subscramblers.length === 1) {
      subscrambler = subscramblers[0];
    } else if (subscramblers.length > 1) {
      subscrambler = this._subscrambleDropdown.value();
    }
    
    // Close this popup and the header popup behind it.
    this._dialog.close();
    window.app.view.closePuzzles();
    
    // Add the puzzle and switch to it.
    window.app.home.addPuzzle({
      name: name,
      icon: icon,
      scrambler: scrambler,
      scrambleType: subscrambler,
      scrambleLength: 0,
      blindfolded: this._bldCheck.checked(),
      lastUsed: new Date().getTime()
    });
  };
  
  // _fieldPositions computes the top coordinates for each field.
  AddPopup.prototype._fieldPositions = function() {
    if (this._showingSubscramble) {
      var contentHeight = FIELD_HEIGHT * 5;
      var spacing = (CONTENT_HEIGHT-contentHeight) / 6;
      var tops = [];
      for (var i = 0; i < 5; ++i) {
        if (i !== 3) {
          tops.push(Math.round(spacing*(i+1) + FIELD_HEIGHT*i));
        }
      }
      return tops;
    } else {
      var contentHeight = FIELD_HEIGHT * 4;
      var spacing = (CONTENT_HEIGHT-contentHeight) / 5;
      var tops = [];
      for (var i = 0; i < 4; ++i) {
        tops[i] = Math.round(spacing*(i+1) + FIELD_HEIGHT*i);
      }
      return tops;
    }
  };
  
  // _handleClose makes sure no dropdowns are open.
  AddPopup.prototype._handleClose = function() {
    this._iconDropdown.hide();
    this._scrambleDropdown.hide();
    this._subscrambleDropdown.hide();
    window.app.flavors.removeCheckbox(this._bldCheck);
  };
  
  // _initialLayout puts the fields in their respective places.
  AddPopup.prototype._initialLayout = function() {
    // Compute the subscramble field's position.
    var contentHeight = FIELD_HEIGHT * 5;
    var spacing = (CONTENT_HEIGHT-contentHeight) / 6;
    this._subscrambleField.css({top: spacing*4 + FIELD_HEIGHT*3});
    
    // Compute the position for the rest of the fields and append them.
    var positions = this._fieldPositions();
    var fields = [this._nameField, this._iconField, this._scrambleField,
      this._bldField];
    for (var i = 0; i < 4; ++i) {
      fields[i].css({top: positions[i]});
      this._fields.append(fields[i]);
    }
    this._fields.append(this._subscrambleField);
  };
  
  AddPopup.prototype._shakeName = function() {
    var prefixes = ['webkitAnimation', 'animation'];
    var element = this._nameInput[0];
    for (var i = 0; i < 2; ++i) {
      var prefix = prefixes[i];
      element.style[prefix + 'Name'] = 'shake';
      element.style[prefix + 'Duration'] = '0.5s';
      element.style[prefix + 'Direction'] = 'normal';
      element.style[prefix + 'Delay'] = '0s';
      element.style[prefix + 'FillMode'] = 'none';
    }
    element.addEventListener('animationend', function() {
      element.style.animationName = 'none';
      element.style.webkitAnimationName = 'none';
    });
    element.addEventListener('webkitAnimationEnd', function() {
      element.style.animationName = 'none';
      element.style.webkitAnimationName = 'none';
    });
  };
  
  AddPopup.prototype._subscramblers = function() {
    var puzzle = this._scrambleDropdown.value();
    if (puzzle === 'None') {
      return [];
    }
    
    var names = [];
    var scramblers = window.puzzlejs.scrambler.scramblersForPuzzle(puzzle);
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      names[i] = scramblers[i].name;
    }
    return names;
  };
  
  function createDropdownField(label, options, selected) {
    // Create the element.
    var element = $('<div class="field"></div>');
    
    // Create the label.
    if (label !== null) {
      element.append($('<label><label>').text(label));
    }
    
    // Create the content.
    var dropdown = new window.dropdownjs.Dropdown(FIELD_WIDTH);
    if (options !== null) {
      dropdown.setOptions(options, selected);
    }
    var content = $('<div class="content"></div>');
    content.append(dropdown.element());
    element.append(content);
    
    return {field: element, dropdown: dropdown};
  }
  
  window.app.AddPopup = AddPopup;
  
})();