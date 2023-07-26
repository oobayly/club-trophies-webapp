import { Injectable, Type } from "@angular/core";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "src/app/modules/shared/modals/base-modal.component";
import { Club, Trophy } from "@models";
import { EditClubModalComponent } from "src/app/modules/shared/modals/edit-club-modal/edit-club-modal.component";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { EditTrophyModalComponent } from "src/app/modules/shared/modals/edit-trophy-modal/edit-trophy-modal.component";

/** The default modal options. */
const DEFAULT_MODAL_OPTIONS: NgbModalOptions = {
  centered: true,
};

export interface ShowModalOptions<TModal extends BaseModalComponent<TResult>, TResult> {
  options?: NgbModalOptions;
  configure?: (comonent: TModal) => void;
}
// See: https://github.com/microsoft/TypeScript/issues/40855#issuecomment-701615972
// See: https://stackoverflow.com/questions/53448100/generic-type-of-extended-interface-not-inferred
type ConstraintOf<T extends BaseModalComponent<unknown>> = T extends BaseModalComponent<infer U> ? U : never;

@Injectable({
  providedIn: "root",
})
export class ModalService {
  constructor(
    readonly router: Router,
    public readonly ngbModal: NgbModal,
  ) {
    // Close all modals when the route changes
    router.events.pipe(
      filter((x) => x instanceof NavigationEnd),
    ).subscribe(() => {
      ngbModal.dismissAll();
    });
  }

  /** Creates a modal of the specified type. */
  public async showModal<TModal extends BaseModalComponent<TResult>, TResult>(
    component: Type<TModal>,
    options: ShowModalOptions<TModal, TResult> | undefined = undefined,
  ): Promise<ConstraintOf<TModal> | undefined> {
    const modalOptions = options?.options || DEFAULT_MODAL_OPTIONS;
    const ref = this.ngbModal.open(component, modalOptions);

    if (options?.configure) {
      options.configure(ref.componentInstance as TModal);
    }

    try {
      return await ref.result;
    } catch {
      return undefined;
    }
  }

  public showAddClub(): Promise<string | undefined> {
    return this.showModal(EditClubModalComponent);
  }

  public showAddTrophy(clubId: string): Promise<string | undefined> {
    return this.showModal(EditTrophyModalComponent, {
      configure: (component) => {
        component.clubId = clubId;
      },
    });
  }

  public showEditClub(clubId: string, club: Club): Promise<string | undefined> {
    return this.showModal(EditClubModalComponent, {
      configure: (component) => {
        component.club = club;
        component.clubId = clubId;
      },
    });
  }

  public showEditTrophy(clubId: string, trophyId: string, trophy: Trophy): Promise<string | undefined> {
    return this.showModal(EditTrophyModalComponent, {
      configure: (component) => {
        component.clubId = clubId;
        component.trophy = trophy;
        component.trophyId = trophyId;
      },
    });
  }
}
