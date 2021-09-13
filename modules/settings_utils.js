// handles all settings-validation logic and return valid settings to simulator.js

import { drawSimReadyScreen } from "./drawings.js";

function displaySettingsForm() {

    // ensure only settings button showing
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("stop-btn")[0].style.display = 'none';
    document.getElementsByClassName("save-boundaries-btn")[0].style.display = 'none';

    // turn off canvas, turn on settings
    document.getElementsByClassName("canvas-container")[0].style.display = 'none';
    document.getElementsByClassName("settings-container")[0].style.display = 'block';

    if (simGlobals.sim_type === 'classic') {

        let resilience_input = document.getElementsByClassName("resilience-input")[0];
        let resilience_caption = document.getElementsByClassName("setting-caption-resilience")[0];

        document.getElementsByClassName("resilience-setting-label")[0].style.color = '#333';
        resilience_input.style.pointerEvents = 'none';
        resilience_input.style.color = '#333';
        resilience_input.style.borderBottom = '2px solid #333';
        resilience_input.value = "n/a";
        resilience_caption.style.color = '#333';
        resilience_caption.innerHTML = 'for boundary simulation type only';
    }

    // POP_GROWTH toggle button listener
    let growth_toggle_btn = document.getElementsByClassName("growth-toggle-btn")[0];
    growth_toggle_btn.addEventListener('click', function toggle() {
        if (growth_toggle_btn.innerHTML === 'Constant') {
            growth_toggle_btn.innerHTML = 'Fluctuate';
        }
        else {
            growth_toggle_btn.innerHTML = 'Constant';
        }
    });
}

function validateTotalOrganismsSetting() {
    let total_organisms_setting = document.getElementById("total-organisms");
    let valid_setting;

    if (typeof parseInt(total_organisms_setting.value) === 'number' && parseInt(total_organisms_setting.value) > 0) {

        valid_setting = Math.abs(parseInt(total_organisms_setting.value));

        total_organisms_setting.style.borderBottom = '2px solid var(--custom-green)';
        
        return {
            'status': 'valid',
            'value': valid_setting,
        };
    }
    else {
        total_organisms_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': '* Invalid Initial Population *\nPlease input a positive number less than 1,000',
        }
    }
}

function calculateGeneCount() {
    // must be called after settings submitted
    let gene_count;

    if (simGlobals.sim_type === 'classic') {
        gene_count = 1300 / simGlobals.MAX_GENE;
    }
    else if (simGlobals.sim_type === 'boundary') {
        gene_count = (simGlobals.custom_boundary.scale_statistics.scale * 3.5) / simGlobals.MAX_GENE;
    }

    return gene_count;
}

function validateMutationRateSetting() {
    let mutation_rate_setting = document.getElementById("mutation-rate");
    let valid_setting;

    // consider allowing float here
    if (typeof parseInt(mutation_rate_setting.value) === 'number' && parseFloat(mutation_rate_setting.value) > 0) {

        if (parseFloat(mutation_rate_setting.value) > 100) {
            valid_setting = 1;
        }
        else {
            valid_setting = parseFloat((mutation_rate_setting.value / 100).toFixed(3));
        }

        mutation_rate_setting.style.borderBottom = '2px solid var(--custom-green)';

        return {
            'status': 'valid',
            'value': valid_setting,
        }
    }
    else {
        mutation_rate_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': "* Invalid mutation rate value *\nPlease input a positive percentage value. (3 = 3%)"
        }
    }
}

function validateMovementSetting() {
    let movement_speed_setting = document.getElementById("move-speed");
    let valid_setting;

    if (parseInt(movement_speed_setting.value) > 0 && parseInt(movement_speed_setting.value) <= 5) {

        valid_setting = parseInt(movement_speed_setting.value);

        movement_speed_setting.style.borderBottom = "2px solid var(--custom-green)";

        return {
            'status': 'valid',
            'value': valid_setting
        }
    }
    else {
        movement_speed_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': "* Invalid movement speed value *\nPlease input a positive number between 1 - 5 (inclusive)."
        }
    }   
}

function validateResilienceSetting() {
    let resilience_setting = document.getElementById("resilience");
    let valid_setting;

    if (parseInt(resilience_setting.value) >= 0 && parseInt(resilience_setting.value) <= 100 && typeof parseInt(resilience_setting.value) === 'number') {

        valid_setting = parseInt(resilience_setting.value) / 100;

        resilience_setting.style.borderBottom = "2px solid var(--custom-green)";

        return {
            'status': 'valid',
            'value': valid_setting
        }
    }
    else {
        resilience_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': "* Invalid resilience value *\nPlease input a positive number between 0 - 100 (inclusive)"
        }
    } 
}

function validateSettingsForm() {

    let settings_manager = {};

    settings_manager.organisms_setting = validateTotalOrganismsSetting();
    settings_manager.movement_setting = validateMovementSetting();
    settings_manager.mutation_setting = validateMutationRateSetting();

    if (simGlobals.sim_type === 'boundary') {
        settings_manager.resilience_setting = validateResilienceSetting();
    }

    let settings = Object.values(settings_manager);

    let all_settings_valid = true;

    // alert user of invalid setting value
    settings.forEach((setting => {
        if (setting.status != 'valid') {
            alert(setting.value);
            all_settings_valid = false;
        }
    }));

    if (all_settings_valid) {
        // turns off settings form, turns on canvas and run-btn
        applyValidSettings(settings_manager);
        drawSimReadyScreen(); // drawing
    }

    // don't submit the form
    return false;
}

function applyValidSettings(settings_manager) {

    // apply setting to global object
    simGlobals.TOTAL_ORGANISMS = settings_manager.organisms_setting.value;
    simGlobals.MIN_GENE = settings_manager.movement_setting.value * -1;
    simGlobals.MAX_GENE = settings_manager.movement_setting.value;
    simGlobals.MUTATION_RATE = settings_manager.mutation_setting.value;
    simGlobals.GENE_COUNT = calculateGeneCount();

    // dialogue
    if (document.getElementById("dialogue-checkbox").checked) {
        simGlobals.dialogue = true;
    }
    else {
        simGlobals.dialogue = false;
    }

    // population growth
    if (document.getElementsByClassName("growth-toggle-btn")[0].innerHTML === 'Constant') {
        simGlobals.POP_GROWTH = 'constant';
    }
    else {
        simGlobals.POP_GROWTH = 'fluctuate';
    }

    // resilience
    if (simGlobals.sim_type === 'boundary') {
        simGlobals.RESILIENCE = settings_manager.resilience_setting.value;
    }

    // make html changes before function returns
    document.getElementsByClassName("canvas-container")[0].style.display = 'block';
    document.getElementsByClassName("settings-container")[0].style.display = 'none';

    // listener already applied
    let start_btn = document.getElementsByClassName("run-btn")[0];
    start_btn.style.display = 'block';

    return false;
}

function configureSettings() {

    document.getElementsByClassName("setting-submit")[0].style.display = 'block';

    // listen for click on Apply btn (keep active in case user submits an invalid form)
    document.getElementsByClassName("setting-submit")[0].addEventListener("click", function submitForm(event) {
        validateSettingsForm();
    });

    displaySettingsForm();
}

export {
    displaySettingsForm, validateTotalOrganismsSetting,
    validateMutationRateSetting, validateMovementSetting,
    validateResilienceSetting, validateSettingsForm,
    configureSettings, calculateGeneCount,
}