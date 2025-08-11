"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = name;
// lib/utils/naming.ts
function name(env, piece, region, index) {
    const suffix = typeof index === 'number' ? `-${index + 1}` : '';
    return `${env}-${piece}${suffix}-${region}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmFtaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esb0JBUUM7QUFURCxzQkFBc0I7QUFDdEIsU0FBZ0IsSUFBSSxDQUNsQixHQUFXLEVBQ1gsS0FBYSxFQUNiLE1BQWMsRUFDZCxLQUFjO0lBRWQsTUFBTSxNQUFNLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ2hFLE9BQU8sR0FBRyxHQUFHLElBQUksS0FBSyxHQUFHLE1BQU0sSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbGliL3V0aWxzL25hbWluZy50c1xuZXhwb3J0IGZ1bmN0aW9uIG5hbWUoXG4gIGVudjogc3RyaW5nLFxuICBwaWVjZTogc3RyaW5nLFxuICByZWdpb246IHN0cmluZyxcbiAgaW5kZXg/OiBudW1iZXJcbik6IHN0cmluZyB7XG4gIGNvbnN0IHN1ZmZpeCA9IHR5cGVvZiBpbmRleCA9PT0gJ251bWJlcicgPyBgLSR7aW5kZXggKyAxfWAgOiAnJztcbiAgcmV0dXJuIGAke2Vudn0tJHtwaWVjZX0ke3N1ZmZpeH0tJHtyZWdpb259YDtcbn1cbiJdfQ==