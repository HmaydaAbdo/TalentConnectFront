import { Component, EventEmitter, Input, Output, ViewChild, OnInit, inject } from '@angular/core';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { Button } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf, NgClass } from '@angular/common';
import {Role} from "../../../../auth/enum/Role";
import {AuthService} from "../../../../auth/services/auth.service";


interface SidebarItem {
  label?: string;
  icon?: string;
  routerLink?: string;
  command?: () => void;
  separator?: boolean;
  items?: SidebarItem[];
  styleClass?: string;
  expanded?: boolean;
  badge?: string;
  badgeClass?: string;
  roles?: Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    SidebarModule,
    Button,
    Ripple,
    StyleClassModule,
    RouterLink,
    RouterLinkActive,
    NgFor,
    NgIf,
    NgClass,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit { // Implement OnInit
  @Input() sidebarVisible: boolean = false;
  @Output() sidebarVisibleChange = new EventEmitter<boolean>();

  @ViewChild('sidebarRef') sidebarRef!: Sidebar;

  private authService = inject(AuthService); // Inject AuthService

  sidebarItems: SidebarItem[] = [
    { label: 'Metiers', icon: 'pi pi-briefcase', routerLink: '/portail/metiers' },
    { label: 'Candidatures', icon:'pi-id-card',routerLink: '/portail/candidatures' }
  ];

  filteredSidebarItems: SidebarItem[] = [];

  ngOnInit(): void {
    this.filterSidebarItems();
    // Subscribe to isAuthenticated$ to re-filter if auth state changes
    this.authService.isAuthenticated$.subscribe(() => {
      this.filterSidebarItems();
    });
  }

  closeCallback(e: MouseEvent): void {
    this.sidebarVisible = false;
    this.sidebarVisibleChange.emit(this.sidebarVisible);
  }

  toggleMenuItem(item: SidebarItem): void {
    if (item.items) {
      item.expanded = !item.expanded;
    }
  }

  openSidebar(): void {
    this.sidebarVisible = true;
    this.sidebarVisibleChange.emit(this.sidebarVisible);
  }

  private hasRequiredRole(item: SidebarItem): boolean {
    // If no roles are specified for the item, it's visible to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if the user has at least one of the required roles
    return item.roles.some(role => this.authService.hasRole(role));
  }

  private filterSidebarItems(): void {
    this.filteredSidebarItems = this.sidebarItems.filter(item => {
      if (item.items) {
        // If the item has sub-items, filter its sub-items recursively
        item.items = item.items.filter(subItem => {
          if (subItem.items) {
            subItem.items = subItem.items.filter(subSubItem => this.hasRequiredRole(subSubItem));
            return subItem.items.length > 0 || this.hasRequiredRole(subItem); // Keep parent if it or any sub-sub-item is visible
          }
          return this.hasRequiredRole(subItem);
        });
        return item.items.length > 0 || this.hasRequiredRole(item); // Keep parent if it or any sub-item is visible
      }
      return this.hasRequiredRole(item);
    });
  }
}
