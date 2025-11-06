// src/presentation/menu/TestMenuProvider.test.ts

import { TestMenuProvider, TestMenuItem } from './TestMenuProvider';

describe('TestMenuProvider - Integration Tests', () => {
  let menuProvider: TestMenuProvider;

  beforeEach(() => {
    menuProvider = new TestMenuProvider();
  });

  describe('Refresh Functionality', () => {
    it('should trigger refresh event when refresh is called', () => {
      // Arrange
      const firespy = jest.fn();
      (menuProvider as any)._onDidChangeTreeData.fire = firespy;

      // Act
      menuProvider.refresh();

      // Assert
      expect(firespy).toHaveBeenCalledWith(undefined);
    });

    it('should return same tree structure after refresh', async () => {
      // Arrange
      const itemsBefore = await menuProvider.getChildren();

      // Act
      menuProvider.refresh();
      const itemsAfter = await menuProvider.getChildren();

      // Assert
      expect(itemsAfter).toHaveLength(itemsBefore.length);
      expect(itemsAfter[0].label).toBe(itemsBefore[0].label);
    });
  });

});