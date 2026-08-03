import { beforeEach, describe, expect, it } from 'vitest';
import { dom } from '../src/dom.js';
import { openEditor, openScenarioForm } from '../src/editor.js';
import { reset } from '../src/board.js';

describe('scenario editor form', () => {
  beforeEach(() => {
    reset();
    openEditor();
  });

  it('opens the visual step form with fields, a step selector and actions', () => {
    openScenarioForm();
    const form = dom.mChoices.children[0];
    expect(dom.overlay.classList.contains('on')).toBe(true);
    expect(form._cls).toBe('scenario-editor-form');
    expect(form.children).toHaveLength(7);
    expect(dom.mActions.children).toHaveLength(5);
    const stepSelector = form.children[6];
    expect(stepSelector.children).toHaveLength(1);
    dom.mActions.children[0].onclick();
    expect(stepSelector.children).toHaveLength(2);
  });

  it('removes a selected step but keeps the last required step intact', () => {
    openScenarioForm();
    const form = dom.mChoices.children[0];
    const stepSelector = form.children[6];
    dom.mActions.children[0].onclick();
    expect(stepSelector.children).toHaveLength(2);
    dom.mActions.children[2].onclick();
    expect(stepSelector.children).toHaveLength(1);
    dom.mActions.children[2].onclick();
    expect(stepSelector.children).toHaveLength(1);
  });

  it('saves the selected step with a reach objective', () => {
    openScenarioForm();
    let form = dom.mChoices.children[0];
    dom.mActions.children[0].onclick();
    form.children[1].children[1].value = 'Дойди до выхода.';
    form.children[2].children[1].value = 'Reach the exit.';
    form.children[3].children[1].value = 'reach';
    form.children[4].children[1].value = '4';
    form.children[5].children[1].value = '0';
    dom.mActions.children[1].onclick();

    openScenarioForm();
    form = dom.mChoices.children[0];
    expect(form.children[1].children[1].value).toBe('Дойди до выхода.');
    expect(form.children[3].children[1].value).toBe('reach');
    expect(form.children[4].children[1].value).toBe('4');
  });
});
