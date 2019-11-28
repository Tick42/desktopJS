/**
 * @module @morgan-stanley/desktopjs-glue42
 */

import {
    registerContainer,
    ContainerWindow,
    PersistedWindowLayout,
    Rectangle,
    WebContainerBase,
    ScreenManager,
    Display,
    Point,
    ObjectTransform,
    PropertyMap,
    NotificationOptions,
    ContainerNotification,
    TrayIconDetails,
    MenuItem,
    Guid,
    MessageBus,
    MessageBusSubscription,
    MessageBusOptions,
    EventArgs,
    GlobalShortcutManager,
    PersistedWindow
} from "@morgan-stanley/desktopjs";

registerContainer("Glue42", {
    condition: () => window !== undefined && "glue42gd" in window && "gluePromise" in window,
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
        return this.innerWindow.navigate(url);
    }

    public focus(): Promise<void> {
        return this.innerWindow.focus();
    }

    public show(): Promise<void> {
        return this.innerWindow.setVisible(true);
    }

    public hide(): Promise<void> {
        return this.innerWindow.setVisible(false);
    }

    public close(): Promise<void> {
        return this.innerWindow.close();
    }

    public minimize(): Promise<void> {
        return this.innerWindow.minimize();
    }

    public maximize(): Promise<void> {
        return this.innerWindow.maximize();
    }

    public restore(): Promise<void> {
        return this.innerWindow.restore();
    }

    public isShowing(): Promise<boolean> {
        return Promise.resolve(this.innerWindow.isVisible);
    }

    public getSnapshot(): Promise<string> {
        return this.innerWindow.capture();
    }

    public getBounds(): Promise<Rectangle> {
        const { left, top, width, height } = this.innerWindow.bounds;
        return Promise.resolve(new Rectangle(left, top, width, height));
    }

    public flash(enable: boolean, options?: any): Promise<void> {
        return this.innerWindow.flash(enable);
    }

    public setBounds({ x, y, width, height }: Rectangle): Promise<void> {
        return this.innerWindow.moveResize({ left: x, top: y, width, height });
    }

    public get allowGrouping() {
        return true;
    }

    public getGroup(): Promise<ContainerWindow[]> {
        return Promise.resolve(this.innerWindow.group.windows.map(window => new Glue42ContainerWindow(window)));
    }

    public joinGroup(target: ContainerWindow): Promise<void> {
        return this.innerWindow.snap(target.innerWindow);
    }

    public leaveGroup(): Promise<void> {
        return this.innerWindow.moveResize({ top: 100 });
    }

    public bringToFront(): Promise<void> {
        return this.innerWindow.activate();
    }

    public getOptions(): Promise<any> {
        return Promise.resolve(this.innerWindow.settings);
    }

    public getState(): Promise<any> {
        return Promise.resolve(this.innerWindow.state);
    }

    public setState(state: any): Promise<void> {
        switch (state) {
            case "maximized":
                return this.innerWindow.maximize();
            case "minimized":
                return this.innerWindow.maximize();
            case "normal":
                return this.innerWindow.maximizeRestore();
            default:
                return Promise.resolve();
        }
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

    public get nativeWindow(): Window {
        return this.innerWindow.getNativeWindow(); // TODO
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
    private mainWindow: Glue42ContainerWindow;

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

    public ready: () => Promise<any>;

    public constructor(desktop?: any, win?: Window, options?: any) {
        super(win);
        this.hostType = "Glue42";
        this.ready = () => this.initGlue(options);
    }

    public async initGlue(options: any): Promise<void> {
        const glue = await (<any>window).gluePromise;
        this.desktop = glue;
        (<any>window).glue = glue;

        this.ipc = this.createMessageBus();

        let replaceNotificationApi = Glue42Container.replaceNotificationApi;
        if (options && typeof options.replaceNotificationApi !== "undefined") {
            replaceNotificationApi = options.replaceNotificationApi;
        }

        if (replaceNotificationApi) {
            this.registerNotificationsApi();
        }

        this.screen = new Glue42DisplayManager(this.desktop);
        this.mainWindow = this.wrapWindow(glue.windows.my()); // TODO

        this.globalShortcut = new Glue42GlobalShortcutManager(this.desktop);
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
        throw new Error("Method not implemented."); // TODO
    }

    public getMainWindow(): ContainerWindow {
        return this.mainWindow; // TODO
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

    public async buildLayout(): Promise<PersistedWindowLayout | null> {
        throw new Error("Method not implemented.");
    }

}

/** @private */
class Glue42DisplayManager implements ScreenManager {
    private glue: any;

    constructor(glue: any) {
        this.glue = glue;
    }

    private mapDisplay(glueDisplay: any): Display {
        const { left, top, width, height } = glueDisplay.bounds;
        const { left: wasLeft, top: waTop, width: waWidth, height: waHeight } = glueDisplay.workingArea;

        const { id, scaleFactor } = glueDisplay;

        return {
            id, scaleFactor,
            bounds: new Rectangle(left, top, width, height),
            workArea: new Rectangle(wasLeft, waTop, waWidth, waHeight)
        };
    }

    public getPrimaryDisplay(): Promise<Display> {
        return this.glue.displays.getPrimary().then(this.mapDisplay);
    }

    public getAllDisplays(): Promise<Display[]> {
        return this.glue.displays.all().then((displays) => displays.map(this.mapDisplay));
    }

    public getMousePosition(): Promise<Point> {
        return this.glue.displays.getMousePosition();
    }
}

/** @private */
class Glue42GlobalShortcutManager extends GlobalShortcutManager {
    private readonly desktop: any;

    public constructor(desktop: any) {
        super();
        this.desktop = desktop;
    }

    public register(shortcut: string, callback: () => void): Promise<void> {
        return this.desktop.hotkeys.register(shortcut, callback);
    }

    public isRegistered(shortcut: string): Promise<boolean> {
        return this.desktop.hotkeys.isRegistered(shortcut);
    }

    public unregister(shortcut: string): Promise<void> {
        return this.desktop.hotkeys.unregister(shortcut);
    }

    public unregisterAll(): Promise<void> {
        return this.desktop.GlobalHotkey.unregisterAll();
    }
}
