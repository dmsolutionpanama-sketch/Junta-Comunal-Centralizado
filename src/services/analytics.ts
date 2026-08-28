/**
 * Google Analytics 4 (GA4) Service - Junta Comunal
 * Handles pageviews, custom events and metrics tracking safely
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

class AnalyticsService {
  private measurementId: string;
  private initialized: boolean = false;

  constructor() {
    this.measurementId =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GA_MEASUREMENT_ID) ||
      'G-JC-PANAMA2025';
    this.init();
  }

  public init() {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        if (window.dataLayer) {
          window.dataLayer.push(arguments);
        }
      }
      window.gtag = gtag;

      gtag('js', new Date());
      gtag('config', this.measurementId, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
      });

      this.initialized = true;
    } catch (e) {
      console.warn('Analytics initialization fallback', e);
    }
  }

  public trackPageView(pagePath: string, pageTitle?: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      });
    }
  }

  public trackEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public trackAuthEvent(action: string, role?: string) {
    this.trackEvent('auth_action', {
      action,
      user_role: role || 'unauthenticated',
    });
  }

  public trackTicketCreated(ticketId: string, category: string, sector: string) {
    this.trackEvent('ticket_create', {
      ticket_id: ticketId,
      category_name: category,
      sector_name: sector,
    });
  }

  public trackTicketSearched(query: string, found: boolean) {
    this.trackEvent('ticket_search', {
      search_term: query,
      result_found: found,
    });
  }

  public trackStatusUpdated(ticketId: string, newStatus: string, responsible: string) {
    this.trackEvent('ticket_status_update', {
      ticket_id: ticketId,
      new_status: newStatus,
      responsible_person: responsible,
    });
  }

  public trackUserRegistered(email: string, sector: string, role: string) {
    this.trackEvent('user_register', {
      user_sector: sector,
      assigned_role: role,
    });
  }
}

export const analytics = new AnalyticsService();
