import { Injectable, Type } from "@angular/core";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "src/app/modules/shared/modals/base-modal.component";
import { Club, Trophy, TrophyFile, Winner } from "@models";
import { EditClubModalComponent } from "src/app/modules/shared/modals/edit-club-modal/edit-club-modal.component";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { EditTrophyModalComponent } from "src/app/modules/shared/modals/edit-trophy-modal/edit-trophy-modal.component";
import { LightboxModalComponent } from "src/app/modules/shared/modals/lightbox-modal/lightbox-modal.component";
import { DbRecord } from "../interfaces/DbRecord";
import { AlertButton, AlertModalComponent } from "src/app/modules/shared/modals/alert-modal/alert-modal.component";
import { EditFileModalComponent } from "src/app/modules/shared/modals/edit-file-modal/edit-file-modal.component";
import { EditWinnerModalComponent } from "src/app/modules/shared/modals/edit-winner-modal/edit-winner-modal.component";
import { getIconForColor } from "@helpers/angular";
import { DbService } from "./db.service";
import { FileUploadModalComponent } from "src/app/modules/shared/modals/file-upload-modal/file-upload-modal.component";
import { getDoc } from "@angular/fire/firestore";

/** The default modal options. */
const DEFAULT_MODAL_OPTIONS: NgbModalOptions = {
  centered: true,
};

export type AlertButtons = "ok" | "ok-cancel" | "yes-no" | "yes-no-cancel";

export interface AlertOptions<T extends AlertButtons | AlertButton<TValue> | AlertButton<TValue>[], TValue extends string | number | boolean> {
  title: string;
  message: string;
  icon: "question" | "exlamation" | string;
  buttons: T;
}

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
    private readonly db: DbService,
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

  private getBootstrapIcon(icon: string): string {
    switch (icon) {
      case "question":
        return "bi-question-circle";
      case "info":
      case "warning":
      case "danger":
        return getIconForColor(icon) || icon;
      default:
        return icon;
    }
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

  public async showEditClub(clubId?: string): Promise<string | undefined> {
    let club: Club | undefined;
    if (clubId) {
      club = (await getDoc(this.db.getClubDoc(clubId))).data();
    }

    return this.showModal(EditClubModalComponent, {
      configure: (component) => {
        component.clubId = clubId;
        component.club = club;
      },
    });
  }

  public async showEditTrophy(clubId: string, trophyId?: string): Promise<string | undefined> {
    let trophy: Trophy | undefined;
    if (trophyId) {
      trophy = (await getDoc(this.db.getTrophyDoc(clubId, trophyId))).data();
    }

    return this.showModal(EditTrophyModalComponent, {
      configure: (component) => {
        component.clubId = clubId;
        component.trophy = trophy;
        component.trophyId = trophyId;
      },
    });
  }

  public async showEditTrophyFile(clubId: string, trophyId: string, fileId: string): Promise<string | undefined> {
    const file = (await getDoc(this.db.getFileDoc(clubId, trophyId, fileId))).data()

    if (!file) {
      throw new Error("File not found.");
    }

    return this.showModal(EditFileModalComponent, {
      configure: (component) => {
        component.clubId = clubId;
        component.trophyId = trophyId;
        component.fileId = fileId;
        component.file = file;
      },
    });
  }

  public async showEditWinner(clubId: string, trophyId: string, winnerId?: string): Promise<string | undefined> {
    let winner: Winner | undefined;
    let boatRef: string | undefined;

    if (winnerId) {
      winner = (await getDoc(this.db.getWinnerDoc(clubId, trophyId, winnerId))).data();
    } else {
      const trophy = (await getDoc(this.db.getTrophyDoc(clubId, trophyId))).data();

      boatRef = trophy?.boatRef?.path;
    }

    return this.showModal(EditWinnerModalComponent, {
      configure: (component) => {
        component.boatRef = boatRef;
        component.clubId = clubId;
        component.trophyId = trophyId;
        component.winnerId = winnerId;
        component.winner = winner;
      },
    });
  }

  public async showLightbox(photos: DbRecord<TrophyFile>[], selectedId: string | undefined = ""): Promise<void> {
    const found = photos.find((x) => x.id === selectedId);

    selectedId = found?.id || photos[0].id;

    if (!selectedId) {
      return;
    }

    return await this.showModal(LightboxModalComponent, {
      options: {
        fullscreen: true,
      },
      configure: (component) => {
        component.photos = photos;
        component.selectedId = selectedId;
      },
    });
  }

  public async showAlert(options: AlertOptions<"ok", boolean>): Promise<void>;
  public async showAlert(options: AlertOptions<"yes-no" | "ok-cancel", boolean>): Promise<boolean>;
  public async showAlert(options: AlertOptions<"yes-no-cancel", boolean>): Promise<boolean | undefined>;
  public async showAlert<TValue extends string | number | boolean>(options: AlertOptions<AlertButton<TValue>[], TValue>): Promise<TValue | undefined>;
  public async showAlert<TValue extends string | number | boolean>(options: AlertOptions<AlertButton<TValue>, TValue>): Promise<void>;
  public async showAlert<TValue extends string | number | boolean>(options: AlertOptions<AlertButtons | AlertButton<TValue> | AlertButton<TValue>[], TValue>): Promise<TValue | undefined> {
    let buttons: AlertButton<TValue>[];
    let allowUndefined = true;
    let isVoid = false;

    if (Array.isArray(options.buttons)) {
      buttons = options.buttons;
    } else if (typeof options.buttons === "string") {
      switch (options.buttons) {
        case "ok":
          isVoid = true;
          buttons = [{ text: "Ok", color: "success", value: true } as AlertButton<TValue>];
          break;
        case "ok-cancel":
          allowUndefined = false;
          buttons = [
            { text: "Cancel", color: "dark", outline: true, value: false } as AlertButton<TValue>,
            { text: "Ok", color: "success", value: true } as AlertButton<TValue>,
          ];
          break;
        case "yes-no-cancel":
          buttons = [
            { text: "Cancel", color: "dark", outline: true, value: undefined } as AlertButton<TValue>,
            { text: "No", color: "danger", outline: true, value: false } as AlertButton<TValue>,
            { text: "Yes", color: "success", value: true } as AlertButton<TValue>,
          ];
          break;
        case "yes-no":
          allowUndefined = false;
          buttons = [
            { text: "No", color: "danger", outline: true, value: false } as AlertButton<TValue>,
            { text: "Yes", color: "success", value: true } as AlertButton<TValue>,
          ];
          break;
      }
    } else {
      isVoid = true;
      buttons = [options.buttons];
    }

    const icon = this.getBootstrapIcon(options.icon);
    const resp = await this.showModal(AlertModalComponent<TValue>, {
      configure: (component) => {
        component.title = options.title;
        component.message = options.message;
        component.icon = icon;
        component.buttons = buttons;
      },
    });

    if (isVoid) {
      // For a single button, there's no return type
      return;
    } else if (allowUndefined) {
      return resp;
    }

    return (resp || false) as TValue;
  }

  public async showDelete(title: string, message: string): Promise<boolean> {
    const resp = await this.showAlert({
      title,
      message,
      icon: "question",
      buttons: [
        { text: "Delete", color: "danger", outline: true, value: true },
        { text: "Cancel", color: "dark", value: false },
      ],
    });

    return resp || false;
  }

  /** Show the modal for uploading a club logo. */
  public async showFileUpload(clubId: string): Promise<string>;
  /** Show the modal for uploading trophy files. */
  public async showFileUpload(clubId: string, trophyId: string, files?: FileList | File[]): Promise<string[]>;
  public async showFileUpload(clubId: string, trophyId?: string, files?: FileList | File[]): Promise<string[] | string | undefined> {
    return await this.showModal(FileUploadModalComponent, {
      options: {

      },
      configure: (component) => {
        component.clubId = clubId;
        component.trophyId = trophyId;
        component.mode = trophyId ? "trophy-file" : "logo";
        component.files = files ? Array.from(files) : undefined;
      },
    });
  }
}
