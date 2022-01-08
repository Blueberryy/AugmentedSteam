import {HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature, Stats} from "../../../modulesContent";

export default class FAchievementBar extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showachinstore")
            && this.context.hasAchievements
            && document.getElementById("my_activity") !== null;
    }

    async apply() {
        const achieveBar = await Stats.getAchievementBar("/my", this.context.communityAppid);
        if (!achieveBar) {
            console.warn("Failed to retrieve achievement stats");
            return;
        }

        HTML.afterBegin("#my_activity", `<div class="es-achieveBar-store">${achieveBar}</div>`);
    }
}
