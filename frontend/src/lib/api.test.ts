import { describe, it, expect } from 'vitest';
import * as api from './api';

describe('API Functions', () => {
  describe('User APIs', () => {
    it('exports getCurrentUser function', () => {
      expect(api.getCurrentUser).toBeDefined();
      expect(typeof api.getCurrentUser).toBe('function');
    });

    it('exports getUsers function', () => {
      expect(api.getUsers).toBeDefined();
    });
  });

  describe('Profile APIs', () => {
    it('exports getMyProfile function', () => {
      expect(api.getMyProfile).toBeDefined();
    });

    it('exports createProfile function', () => {
      expect(api.createProfile).toBeDefined();
    });

    it('exports updateProfile function', () => {
      expect(api.updateProfile).toBeDefined();
    });
  });

  describe('Couple APIs', () => {
    it('exports getMyCouples function', () => {
      expect(api.getMyCouples).toBeDefined();
    });

    it('exports createCouple function', () => {
      expect(api.createCouple).toBeDefined();
    });

    it('exports joinCouple function', () => {
      expect(api.joinCouple).toBeDefined();
    });
  });

  describe('Section APIs', () => {
    it('exports getSections function', () => {
      expect(api.getSections).toBeDefined();
    });

    it('exports createSection function', () => {
      expect(api.createSection).toBeDefined();
    });

    it('exports updateSection function', () => {
      expect(api.updateSection).toBeDefined();
    });

    it('exports deleteSection function', () => {
      expect(api.deleteSection).toBeDefined();
    });
  });

  describe('Activity APIs', () => {
    it('exports getActivities function', () => {
      expect(api.getActivities).toBeDefined();
    });

    it('exports createActivity function', () => {
      expect(api.createActivity).toBeDefined();
    });

    it('exports updateActivity function', () => {
      expect(api.updateActivity).toBeDefined();
    });

    it('exports deleteActivity function', () => {
      expect(api.deleteActivity).toBeDefined();
    });

    it('exports markActivityComplete function', () => {
      expect(api.markActivityComplete).toBeDefined();
    });

    it('exports restoreActivity function', () => {
      expect(api.restoreActivity).toBeDefined();
    });

    it('exports reorderActivities function', () => {
      expect(api.reorderActivities).toBeDefined();
    });
  });

  describe('Reminder APIs', () => {
    it('exports getActivityReminders function', () => {
      expect(api.getActivityReminders).toBeDefined();
    });

    it('exports dismissReminder function', () => {
      expect(api.dismissReminder).toBeDefined();
    });
  });

  describe('API Types', () => {
    it('defines Activity type correctly', () => {
      const activity: api.Activity = {
        id: 1,
        couple: 1,
        section: 1,
        section_title: 'Test',
        title: 'Test Activity',
        description: 'Test',
        status: 'not_started',
        is_recurring: false,
        order: 0,
        is_deleted: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(activity.title).toBe('Test Activity');
    });

    it('defines Couple type correctly', () => {
      const couple: api.Couple = {
        id: 1,
        user1: 1,
        user2: 2,
        invite_code: 'TEST123',
        created_at: '2024-01-01',
      };

      expect(couple.invite_code).toBe('TEST123');
    });

    it('defines Section type correctly', () => {
      const section: api.Section = {
        id: 1,
        couple: 1,
        title: 'Test Section',
        display_order: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(section.title).toBe('Test Section');
    });
  });
});
