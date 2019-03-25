/**
 * @module @morgan-stanley/desktopjs-glue42
 */

import {
    registerContainer, ContainerWindow, PersistedWindowLayout, Rectangle, Container, WebContainerBase,
    ScreenManager, Display, Point, ObjectTransform, PropertyMap, NotificationOptions, ContainerNotification,
    TrayIconDetails, MenuItem, Guid, MessageBus, MessageBusSubscription, MessageBusOptions, EventArgs
} from "@morgan-stanley/desktopjs";

registerContainer("Glue42", {
    condition: () => typeof window !== "undefined" && "glue42gd" in window, // TODO: Add "glue" in window check once we inject a pre-loaded glue for the desktopJS-glue application.
    create: (options) => <any>new Glue42Container(null, null, options)
});

const windowEventMap = {
    move: "bounds-changing",
    resize: "bounds-changing",
    close: "close-requested",
    focus: "focused",
    blur: "blurred",
    maximize: "maximized",
    minimize: "minimized",
    restore: "restored"
}; // TODO

/**
 * @augments ContainerWindow
 */
export class Glue42ContainerWindow extends ContainerWindow {
    public constructor(wrap: any) {
        super(wrap);
    }

    public get id(): string {
        return this.innerWindow.id;
    }

    public get name(): string {
        return this.innerWindow.name;
    }

    public load(url: string, options?: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.navigate(url, () => resolve(), () => reject());
        });
    }

    public focus(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.focus(() => resolve(), () => reject());
        });
    }

    public show(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.setVisible(true, () => resolve(), () => reject());
        });
    }

    public hide(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.setVisible(false, () => resolve(), () => reject());
        });
    }

    public close(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.close(() => resolve(), () => reject());
        });
    }

    public minimize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.minimize(() => resolve(), () => reject());
        });
    }

    public maximize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.maximize(() => resolve(), () => reject());
        });
    }

    public restore(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.restore(() => resolve(), () => reject());
        });
    }

    public isShowing(): Promise<boolean> {
        return Promise.resolve(this.innerWindow.isVisible);
    }

    public getSnapshot(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    public getBounds(): Promise<Rectangle> {
        return Promise.resolve(new Rectangle(this.innerWindow.bounds.left, this.innerWindow.bounds.top, this.innerWindow.bounds.width, this.innerWindow.bounds.height));
    }

    public flash(enable: boolean, options?: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public setBounds({ x, y, width, height }: Rectangle): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.moveResize({ left: x, top: y, width, height }, () => resolve(), () => reject());
        });
    }

    public get allowGrouping() {
        return true;
    }

    public getGroup(): Promise<ContainerWindow[]> {
        return Promise.resolve(this.innerWindow.group.windows.map(window => new Glue42ContainerWindow(window)));
    }

    public joinGroup(target: ContainerWindow): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public leaveGroup(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public bringToFront(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.innerWindow.activate(() => resolve(), () => reject());
        });
    }

    public getOptions(): Promise<any> {
        return Promise.resolve(this.innerWindow.settings);
    }

    public getState(): Promise<any> {
        return Promise.resolve(this.innerWindow.state);
    }

    public setState(state: any): Promise<void> {
        throw new Error("Method not implemented."); // TODO
    }

    protected attachListener(eventName: string, listener: (...args: any[]) => void): void {
        throw new Error("Method not implemented."); // TODO
    }

    protected wrapListener(eventName: string, listener: (event: EventArgs) => void): (event: EventArgs) => void {
        throw new Error("Method not implemented."); // TODO
    }

    protected detachListener(eventName: string, listener: (...args: any[]) => void): any {
        throw new Error("Method not implemented."); // TODO
    }
}

/**
 * @augments MessageBus
 */
export class Glue42MessageBus implements MessageBus {
    private bus: any;
    private unsubs: { [key: string]: () => Promise<void> };

    public constructor(bus: any) {
        this.bus = bus;
        this.unsubs = {};
    }

    public subscribe<T>(topic: string, listener: (event: any, message: T) => void, options?: MessageBusOptions): Promise<MessageBusSubscription> {
        const callback = (data: any, topic: string) => {
            return listener({ topic }, data);
        };
        const newOptions = {};

        if (options && options.uuid) {
            newOptions["target"] = options.uuid;
        }

        return this.bus.subscribe(topic, callback, newOptions)
            .then((unsub: { [unsubscribe: string]: () => Promise<void> }) => {

                const subscription: MessageBusSubscription = new MessageBusSubscription(topic, (message: any) => {
                    listener({ topic }, message);
                }, options);

                this.unsubs[JSON.stringify(subscription)] = unsub.unsubscribe;

                return subscription;
            });
    }

    public unsubscribe(subscription: MessageBusSubscription): Promise<void> {
        return this.unsubs[JSON.stringify(subscription)]();
    }

    public publish<T>(topic: string, message: T, options?: MessageBusOptions): Promise<void> {
        const newOptions = {};

        if (options && options.uuid) {
            newOptions["target"] = options.uuid;
        }

        return this.bus.publish(topic, message, newOptions);
    }
}

/**
 * @extends WebContainerBase
 */
export class Glue42Container extends WebContainerBase {
    private desktop: any;
    public static replaceNotificationApi: boolean = true;

    public static readonly windowOptionsMap: PropertyMap = {
        alwaysOnTop: { target: "onTop" },
        maximizable: { target: "allowMaximize" },
        minimizable: { target: "allowMinimize" },
        taskbar: { target: "showInTaskbar" },
        x: { target: "left" },
        y: { target: "top" },
        resizable: { target: "hasSizeAreas" }
    };

    public windowOptionsMap: PropertyMap = Glue42Container.windowOptionsMap;

    public static readonly notificationOptionsMap: PropertyMap = {
        body: { target: "description" }
    };

    public notificationOptionsMap: PropertyMap = Glue42Container.notificationOptionsMap;

    public constructor(desktop?: any, win?: Window, options?: any) {
        super(win);
        this.desktop = desktop || (<any>window).glue;
        this.hostType = "Glue42";

        this.ipc = this.createMessageBus();

        let replaceNotificationApi = Glue42Container.replaceNotificationApi;
        if (options && typeof options.replaceNotificationApi !== "undefined") {
            replaceNotificationApi = options.replaceNotificationApi;
        }

        if (replaceNotificationApi) {
            this.registerNotificationsApi();
        }

        this.screen = new Glue42DisplayManager();
    }

    protected createMessageBus(): MessageBus {
        return new Glue42MessageBus(this.desktop.bus);
    }

    protected registerNotificationsApi() {
        const owningContainer: Glue42Container = this; // tslint:disable-line

        this.globalWindow["Notification"] = class Glue42Notification extends ContainerNotification {
            constructor(title: string, options?: NotificationOptions) {
                super(title, options);

                owningContainer.showNotification(title, options);
            }
        };
    }

    public log(level: "debug" | "info" | "warn" | "error", message: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public getMainWindow(): ContainerWindow {
        throw new Error("Method not implemented.");
    }

    public getCurrentWindow(): ContainerWindow {
        return this.wrapWindow(this.desktop.windows.my());
    }

    protected getWindowOptions(options?: any): any {
        const newOptions = ObjectTransform.transformProperties(options, this.windowOptionsMap);

        if ("center" in newOptions) {
            if (newOptions.center === true) {
                newOptions.startLocation = "CenterScreen";
            }

            delete newOptions.center;
        }

        return newOptions;
    }

    public wrapWindow(containerWindow: any) {
        return new Glue42ContainerWindow(containerWindow);
    }

    public createWindow(url: string, options?: any): Promise<ContainerWindow> {
        const newOptions = this.getWindowOptions(options);
        let name;

        if ("name" in newOptions) {
            name = newOptions.name;
        } else {
            name = Guid.newGuid();
        }

        return this.desktop.windows.open(name, url, newOptions).then(this.wrapWindow);
    }

    public showNotification(title: string, options?: NotificationOptions) {
        const newOptions = ObjectTransform.transformProperties(options, this.notificationOptionsMap);

        this.desktop.agm.invoke(
            "T42.GNS.Publish.RaiseNotification", {
                notification: {
                    title,
                    severity: "High",
                    ...newOptions
                }
            });
    }

    public addTrayIcon(details: TrayIconDetails, listener: () => void, menuItems?: MenuItem[]) {
        throw new Error("Method not implemented.");
    }

    protected closeAllWindows(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public getAllWindows(): Promise<ContainerWindow[]> {
        throw new Error("Method not implemented.");
    }

    public getWindowById(id: string): Promise<ContainerWindow | null> {
        throw new Error("Method not implemented.");
    }

    public getWindowByName(name: string): Promise<ContainerWindow | null> {
        throw new Error("Method not implemented.");
    }

    public saveLayout(name: string): Promise<PersistedWindowLayout> {
        throw new Error("Method not implemented.");
    }
}

/** @private */
class Glue42DisplayManager implements ScreenManager {
    createDisplay(monitorDetails: any) {
        const display = new Display();
        display.id = monitorDetails.id;
        display.scaleFactor = monitorDetails.scale;

        display.bounds = new Rectangle(monitorDetails.left,
            monitorDetails.top,
            monitorDetails.width,
            monitorDetails.height);

        display.workArea = new Rectangle(monitorDetails.workingAreaLeft,
            monitorDetails.workingAreaTop,
            monitorDetails.workingAreaWidth,
            monitorDetails.workingAreaHeight);

        return display;
    }

    public getPrimaryDisplay(): Promise<Display> {
        return Promise.resolve(this.createDisplay((<any>window).glue42gd.monitors.find(monitor => monitor.isPrimary)));
    }

    public getAllDisplays(): Promise<Display[]> {
        return Promise.resolve((<any>window).glue42gd.monitors.map(this.createDisplay));
    }

    public getMousePosition(): Promise<Point> {
        throw new Error("Method not implemented.");
    }
}
