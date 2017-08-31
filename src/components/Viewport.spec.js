import Viewport from './Viewport';

describe('Viewport.screenToWorld', () => {
  test('Correctly project points at origin', () => {
    const viewport = new Viewport();
    viewport.setPosition(0, 0);
    viewport.setSize(100, 100);
    viewport.setScale(1);

    // Origin
    expect(viewport.pointToWorld(50, 50)).toEqual([0, 0]);
    // I quadrant
    expect(viewport.pointToWorld(60, 60)).toEqual([10, 10]);
    // II quadrant
    expect(viewport.pointToWorld(40, 60)).toEqual([-10, 10]);
    // III quadrant
    expect(viewport.pointToWorld(40, 40)).toEqual([-10, -10]);
    // IV quadrant
    expect(viewport.pointToWorld(60, 40)).toEqual([10, -10]);
  });

  test('Correctly scale points at origin', () => {
    const viewport = new Viewport();
    viewport.setPosition(0, 0);
    viewport.setSize(100, 100);
    viewport.setScale(2);

    // Same order as above
    expect(viewport.pointToWorld(50, 50)).toEqual([0, 0]);
    expect(viewport.pointToWorld(70, 70)).toEqual([10, 10]);
    expect(viewport.pointToWorld(30, 70)).toEqual([-10, 10]);
    expect(viewport.pointToWorld(30, 30)).toEqual([-10, -10]);
    expect(viewport.pointToWorld(70, 30)).toEqual([10, -10]);
  });

  test('Correctly project points with displacement', () => {
    const viewport = new Viewport();
    viewport.setPosition(10, 10);
    viewport.setSize(100, 100);
    viewport.setScale(1);

    expect(viewport.pointToWorld(40, 40)).toEqual([0, 0]);
    expect(viewport.pointToWorld(40 + 10, 40 + 10)).toEqual([10, 10]);
    expect(viewport.pointToWorld(40 - 10, 40 + 10)).toEqual([-10, 10]);
    expect(viewport.pointToWorld(40 - 10, 40 - 10)).toEqual([-10, -10]);
    expect(viewport.pointToWorld(40 + 10, 40 - 10)).toEqual([10, -10]);
  });

  test('Correctly scale points with displacement', () => {
    const viewport = new Viewport();
    viewport.setPosition(10, 10);
    viewport.setSize(100, 100);
    viewport.setScale(2);

    const cx = 50 - 20;
    const cy = 50 - 20;

    expect(viewport.pointToWorld(cx, cy)).toEqual([0, 0]);
    expect(viewport.pointToWorld(cx + 20, cy + 20)).toEqual([10, 10]);
    expect(viewport.pointToWorld(cx - 20, cy + 20)).toEqual([-10, 10]);
    expect(viewport.pointToWorld(cx - 20, cy - 20)).toEqual([-10, -10]);
    expect(viewport.pointToWorld(cx + 20, cy - 20)).toEqual([10, -10]);
  });
});

describe('Viewport.worldToScreen', () => {
  test('Correctly project points at origin', () => {
    const viewport = new Viewport();
    viewport.setPosition(0, 0);
    viewport.setSize(100, 100);
    viewport.setScale(1);

    // Origin
    expect(viewport.pointToScreen(0, 0)).toEqual([50, 50]);
    // I quadrant
    expect(viewport.pointToScreen(10, 10)).toEqual([60, 60]);
    // II quadrant
    expect(viewport.pointToScreen(-10, 10)).toEqual([40, 60]);
    // III quadrant
    expect(viewport.pointToScreen(-10, -10)).toEqual([40, 40]);
    // IV quadrant
    expect(viewport.pointToScreen(10, -10)).toEqual([60, 40]);
  });

  test('Correctly scale points at origin', () => {
    const viewport = new Viewport();
    viewport.setPosition(0, 0);
    viewport.setSize(100, 100);
    viewport.setScale(2);

    // Same order as above
    expect(viewport.pointToScreen(0, 0)).toEqual([50, 50]);
    expect(viewport.pointToScreen(10, 10)).toEqual([70, 70]);
    expect(viewport.pointToScreen(-10, 10)).toEqual([30, 70]);
    expect(viewport.pointToScreen(-10, -10)).toEqual([30, 30]);
    expect(viewport.pointToScreen(10, -10)).toEqual([70, 30]);
  });

  test('Correctly project points with displacement', () => {
    const viewport = new Viewport();
    viewport.setPosition(10, 10);
    viewport.setSize(100, 100);
    viewport.setScale(1);

    expect(viewport.pointToScreen(0, 0)).toEqual([40, 40]);
    expect(viewport.pointToScreen(10, 10)).toEqual([40 + 10, 40 + 10]);
    expect(viewport.pointToScreen(-10, 10)).toEqual([40 - 10, 40 + 10]);
    expect(viewport.pointToScreen(-10, -10)).toEqual([40 - 10, 40 - 10]);
    expect(viewport.pointToScreen(10, -10)).toEqual([40 + 10, 40 - 10]);
  });

  test('Correctly scale points with displacement', () => {
    const viewport = new Viewport();
    viewport.setPosition(10, 10);
    viewport.setSize(100, 100);
    viewport.setScale(2);

    const cx = 50 - 20;
    const cy = 50 - 20;
    expect(viewport.pointToScreen(0, 0)).toEqual([cx, cy]);
    expect(viewport.pointToScreen(10, 10)).toEqual([cx + 20, cy + 20]);
    expect(viewport.pointToScreen(-10, 10)).toEqual([cx - 20, cy + 20]);
    expect(viewport.pointToScreen(-10, -10)).toEqual([cx - 20, cy - 20]);
    expect(viewport.pointToScreen(10, -10)).toEqual([cx + 20, cy - 20]);
  });
});
