import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { test, versionDependent, visibilityClass, popoverPositionClass } from '../../helpers/bootstrap-test';
import {
  setupForPositioning,
  assertPositioning
} from '../../helpers/contextual-help';

module('Integration | Component | bs-popover', function(hooks) {
  setupRenderingTest(hooks);

  test('it has correct markup', async function(assert) {
    // Template block usage:
    await render(hbs`
      {{#bs-popover id="popover-element" fade=true title="dummy title" class="wide" visible=true}}
        template block text
      {{/bs-popover}}
    `);

    assert.dom('.popover').exists({ count: 1 }, 'has popover class');
    assert.dom('.popover.wide').exists({ count: 1 }, 'it passes along class attribute');
    assert.dom('.popover').hasClass('fade', 'has fade class');
    assert.dom('.popover').hasClass(visibilityClass(), 'has visibility class');
    assert.equal(this.element.querySelector('.popover').getAttribute('role'), 'tooltip', 'has ARIA role');
    assert.dom('.arrow').exists({ count: 1 }, 'has arrow');
    assert.dom(versionDependent('.popover-title', '.popover-header')).hasText('dummy title', 'shows title');
    assert.dom(versionDependent('.popover-content', '.popover-body')).hasText('template block text', 'shows content');
  });

  skip('it supports different placements', async function(assert) {
    let placements = ['top', 'left', 'bottom', 'right'];
    this.set('placement', placements[0]);
    await render(hbs`
      <div style="margin: 200px">
        {{#bs-popover/element id="popover-element" placement=placement title="dummy title"}}
          template block text
        {{/bs-popover/element}}
      </div>
    `);
    for (let placement of placements) {
      this.set('placement', placement);
      let placementClass = popoverPositionClass(placement);
      assert.dom('.popover').hasClass(placementClass, `has ${placementClass} class`);
    }
  });

  test('should place popover on top of element', async function(assert) {
    await render(
      hbs`<div id="ember-bootstrap-wormhole"></div><div id="wrapper"><p style="margin-top: 200px"><button class="btn" id="target">Click me{{#bs-popover placement="top" title="very very very very very very very long popover" fade=false}}very very very very very very very long popover{{/bs-popover}}</button></p></div>`
    );

    setupForPositioning();

    await click('#target');
    assertPositioning(assert, '.popover');
  });

  test('should adjust popover arrow', async function(assert) {
    let expectedArrowPosition = versionDependent(225, 219);
    await render(
      hbs`<div id="ember-bootstrap-wormhole"></div><div id="wrapper"><p style="margin-top: 200px"><button class="btn" id="target">Click me{{#bs-popover placement="top" autoPlacement=true viewportSelector="#wrapper" title="very very very very very very very long popover" fade=false}}very very very very very very very long popover{{/bs-popover}}</button></p></div>`
    );

    setupForPositioning('right');

    await click('#target');
    let arrowPosition = parseInt(this.element.querySelector('.arrow').style.left, 10);
    assert.ok(Math.abs(arrowPosition - expectedArrowPosition) <= 2, `Expected position: ${expectedArrowPosition}, actual: ${arrowPosition}`);

    // check again to prevent regression of https://github.com/kaliber5/ember-bootstrap/issues/361
    await click('#target');
    await click('#target');
    arrowPosition = parseInt(this.element.querySelector('.arrow').style.left, 10);
    assert.ok(Math.abs(arrowPosition - expectedArrowPosition) <= 2, `Expected position: ${expectedArrowPosition}, actual: ${arrowPosition}`);
  });

  test('it stays open when clicked when rendered in place', async function(assert) {
    await render(hbs`
      <div id="target">
        {{#bs-popover as |po|}}
          <div id="content">Content</div>
        {{/bs-popover}}
      </div>
    `);

    await click('#target');
    assert.dom('.popover').exists('popover is visible');
    await click('#content');
    assert.dom('.popover').exists('popover is still visible');
  });

  test('it yields close action', async function(assert) {
    let hideAction = this.spy();
    this.set('hide', hideAction);
    let hiddenAction = this.spy();
    this.set('hidden', hiddenAction);
    await render(
      hbs`<div id="target">{{#bs-popover visible=true onHide=(action hide) onHidden=(action hidden) as |po|}}<div id="hide" {{action po.close}}>Hide</div>{{/bs-popover}}</div>`
    );
    await click('#hide');
    assert.ok(hideAction.calledOnce, 'hide action has been called');
    assert.ok(hiddenAction.calledOnce, 'hidden action was called');
    assert.dom('.popover').doesNotExist('popover is not visible');
  });

  test('click-initiated close action does not interfere with click-to-open', async function(assert) {
    await render(
      hbs`<div id="target">{{#bs-popover as |po|}}<div id="hide" onclick={{action po.close}}>Hide</div>{{/bs-popover}}</div>`
    );
    await click('#target');
    assert.dom('.popover').exists('popover is visible');
    await click('#hide');
    assert.dom('.popover').doesNotExist('popover is not visible');
    await click('#target');
    assert.dom('.popover').exists('popover visible again');
  });

  test('click-initiated close action does not interfere with click-to-open when wormholed', async function(assert) {
    await render(
      hbs`<div id="ember-bootstrap-wormhole"></div><div id="target">{{#bs-popover as |po|}}<div id="hide" onclick={{action po.close}}>Hide</div>{{/bs-popover}}</div>`
    );
    await click('#target');
    assert.dom('.popover').exists('popover is visible');
    await click('#hide');
    assert.dom('.popover').doesNotExist('popover is not visible');
    await click('#target');
    assert.dom('.popover').exists('popover visible again');
  })

  test('non-click-initiated close action does not interfere with click-to-open', async function(assert) {
    await render(
      hbs`<div id="target">{{#bs-popover as |po|}}<input id="hide" onblur={{action po.close}}>{{/bs-popover}}</div>`
    );
    await click('#target');
    assert.dom('.popover').exists('popover is visible');
    await triggerEvent('#hide', 'blur');
    assert.dom('.popover').doesNotExist('popover is not visible');
    await click('#target');
    assert.dom('.popover').exists('popover visible again');
  });

  test('non-click-initiated close action does not interfere with click-to-open when wormholed', async function(assert) {
    await render(
      hbs`<div id="ember-bootstrap-wormhole"></div><div id="target">{{#bs-popover as |po|}}<input id="hide" onblur={{action po.close}}>{{/bs-popover}}</div>`
    );
    await click('#target');
    assert.dom('.popover').exists('popover is visible');
    await triggerEvent('#hide', 'blur');
    assert.dom('.popover').doesNotExist('popover is not visible');
    await click('#target');
    assert.dom('.popover').exists('popover visible again');
  })
});
